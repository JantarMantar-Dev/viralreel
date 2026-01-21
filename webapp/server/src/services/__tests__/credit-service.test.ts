
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as sqliteSchema from '../../test/sqlite-schema.js';
import { createTables } from '../../test/db-helper.js';

describe('Credit Service Unit Tests (Real SQLite)', () => {
    let sqlite: Database.Database;
    let db: ReturnType<typeof drizzle>;
    let service: typeof import('../credit-service.js');

    beforeAll(async () => {
        // 1. Setup SQLite
        sqlite = new Database(':memory:');
        db = drizzle(sqlite, { schema: sqliteSchema });

        // PATCH: better-sqlite3 transactions are sync, but our service uses async.
        // We mock the transaction method to just execute the callback.
        // This is necessary because we are testing async Postgres logic on sync SQLite.
        db.transaction = (async (cb: any) => {
            return cb(db);
        }) as any;

        // 2. Initialize DB Schema
        createTables(sqlite);

        // 3. Mock dependencies using doMock (not hoisted)
        vi.doMock('../../db/index.js', () => ({
            db: db
        }));

        vi.doMock('../../db/schema.js', () => ({
            ...sqliteSchema
        }));

        // 4. Import service dynamically to ensure mocks are applied
        service = await import('../credit-service.js');
    });

    beforeEach(() => {
        // Clear tables before each test
        sqlite.exec(`
            DELETE FROM credit_transaction;
            DELETE FROM credit_balance;
            DELETE FROM user;
        `);
    });

    it('should grant initial credits to a new user', async () => {
        const userId = randomUUID();
        
        // Setup user
        await db.insert(sqliteSchema.user).values({
            id: userId,
            name: 'Test User',
            email: `${userId}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await service.grantInitialCredits(userId, 3);

        const [balance] = await db.select().from(sqliteSchema.creditBalance).where(eq(sqliteSchema.creditBalance.userId, userId));
        expect(balance).toBeDefined();
        expect(balance.amountTotal).toBe(3);
        expect(balance.amountUsed).toBe(0);

        const transactions = await db.select().from(sqliteSchema.creditTransaction).where(eq(sqliteSchema.creditTransaction.userId, userId));
        expect(transactions).toHaveLength(1);
        expect(transactions[0].amount).toBe(3);
    });

    it('should not grant initial credits if balance already exists', async () => {
        const userId = randomUUID();
        
        await db.insert(sqliteSchema.user).values({
            id: userId,
            name: 'Test User',
            email: `${userId}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await service.grantInitialCredits(userId, 3);
        await service.grantInitialCredits(userId, 5); // Should skip

        const [balance] = await db.select().from(sqliteSchema.creditBalance).where(eq(sqliteSchema.creditBalance.userId, userId));
        expect(balance.amountTotal).toBe(3); // Still 3
    });

    it('should correctly check if user has enough credits', async () => {
        const userId = randomUUID();
        
        await db.insert(sqliteSchema.user).values({
            id: userId,
            name: 'Test User',
            email: `${userId}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await service.grantInitialCredits(userId, 3);

        expect(await service.hasEnoughCredits(userId, 1)).toBe(true);
        expect(await service.hasEnoughCredits(userId, 3)).toBe(true);
        expect(await service.hasEnoughCredits(userId, 4)).toBe(false);
    });

    it('should deduct credits correctly', async () => {
        const userId = randomUUID();
        
        await db.insert(sqliteSchema.user).values({
            id: userId,
            name: 'Test User',
            email: `${userId}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await service.grantInitialCredits(userId, 3);
        await service.deductCredits(userId, 1, 'Test deduction');

        const [balance] = await db.select().from(sqliteSchema.creditBalance).where(eq(sqliteSchema.creditBalance.userId, userId));
        expect(balance.amountUsed).toBe(1);

        const transactions = await db.select().from(sqliteSchema.creditTransaction).where(eq(sqliteSchema.creditTransaction.userId, userId));
        expect(transactions).toHaveLength(2); // 1 grant + 1 deduction
        expect(transactions.find(t => t.amount === -1)).toBeDefined();
    });

    it('should throw error if insufficient credits for deduction', async () => {
        const userId = randomUUID();
        
        await db.insert(sqliteSchema.user).values({
            id: userId,
            name: 'Test User',
            email: `${userId}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await service.grantInitialCredits(userId, 1);
        
        await expect(service.deductCredits(userId, 2)).rejects.toThrow('Insufficient credits');
    });
});
