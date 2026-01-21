
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestFastify } from '../../test/helpers/fastify.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as sqliteSchema from '../../test/sqlite-schema.js';
import { createTables } from '../../test/db-helper.js';

// Setup SQLite DB
const sqlite = new Database(':memory:');
const db = drizzle(sqlite, { schema: sqliteSchema });

// PATCH: better-sqlite3 transactions are sync, but our service uses async.
// We mock the transaction method to just execute the callback.
(db as any).transaction = async (cb: any) => {
    return cb(db);
};

// Initialize DB structure
createTables(sqlite);

// Mock the DB and Schema
vi.mock('../../db/index.js', () => ({
    db: db
}));

vi.mock('../../db/schema.js', () => ({
    ...sqliteSchema
}));

// We DON'T mock the credit-service.js here because we want to test the full integration flow
// The service code will import our mocked db and schema, so it will use SQLite seamlessly.

describe('Auth-Credits Integration (Real SQLite)', () => {
    beforeEach(() => {
        sqlite.exec('DELETE FROM credit_transaction');
        sqlite.exec('DELETE FROM credit_balance');
        sqlite.exec('DELETE FROM user');
    });

    it('should grant 7 credits when a user is created via the auth flow', async () => {
        const userId = 'user_' + Math.random().toString(36).substring(7);
        const fastify = await createTestFastify({ authenticated: false });
        
        // Setup the route that simulates registration
        // In a real app, this would be the better-auth handler, but we simulate the logic here
        // to verify that the credit service integration works correctly with the DB.
        fastify.post('/api/auth/signup', async (request, reply) => {
            try {
                const newUser = {
                    id: userId,
                    name: 'New User',
                    email: 'new@example.com',
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                // 1. Create User
                await db.insert(sqliteSchema.user).values(newUser);
                
                // 2. Trigger the credit granting logic (as the auth hook would)
                const { grantInitialCredits } = await import('../../services/credit-service.js');
                await grantInitialCredits(newUser.id, 7);
                
                return { success: true, user: newUser };
            } catch (error) {
                console.error('Test Handler Error:', error);
                return reply.code(500).send({ error: error });
            }
        });

        const response = await fastify.inject({
            method: 'POST',
            url: '/api/auth/signup',
            payload: { email: 'new@example.com', password: 'password123' }
        });

        expect(response.statusCode).toBe(200);
        
        // Verify via direct DB query (using SQLite schema)
        const [balance] = await db.select().from(sqliteSchema.creditBalance).where(eq(sqliteSchema.creditBalance.userId, userId));
        expect(balance).toBeDefined();
        expect(balance.amountTotal).toBe(7);
        
        const transactions = await db.select().from(sqliteSchema.creditTransaction).where(eq(sqliteSchema.creditTransaction.userId, userId));
        expect(transactions).toHaveLength(1);
        expect(transactions[0].amount).toBe(7);
        expect(transactions[0].description).toBe('Initial Free Credits');
    });
});
