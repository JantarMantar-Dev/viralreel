
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import paymentsRoutes from '../payments.js';
import { FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

// Mocks - Using vi.hoisted to avoid ReferenceError
const { mockStripe, mockDb, mockEmail, mockRequireAuth } = vi.hoisted(() => {
    const _mockDb = {
        select: vi.fn(),
        update: vi.fn(),
        insert: vi.fn(),
        transaction: vi.fn((cb) => cb(_mockDb)), // execute immediate
        // Add chain helpers if needed inside, but purely for structure
    };
    // Circular reference fix for transaction
    _mockDb.transaction = vi.fn((cb) => cb(_mockDb));

    return {
        mockStripe: {
            checkout: {
                sessions: {
                    retrieve: vi.fn()
                }
            },
            subscriptions: {
                cancel: vi.fn(),
                update: vi.fn(),
                retrieve: vi.fn()
            }
        },
        mockDb: _mockDb,
        mockEmail: {
            sendSubscriptionEmail: vi.fn()
        },
        mockRequireAuth: vi.fn((req, reply, done) => {
            req.user = { id: 'user_123', email: 'test@example.com', name: 'Test User' };
            done();
        })
    };
});

// Mock modules
vi.mock('../../lib/stripe.js', () => ({
    stripe: mockStripe
}));

vi.mock('../../db/index.js', () => ({
    db: mockDb
}));

vi.mock('../../lib/email.js', () => mockEmail);

vi.mock('../../middleware/auth.js', () => ({
    requireAuth: mockRequireAuth
}));

// Helper to mock DB chain
const createDbChain = (result: any[]) => {
    const chain: any = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(), // for update
        values: vi.fn().mockReturnThis(), // for insert
        // Make it thenable so it resolves to result when awaited
        then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
            return Promise.resolve(result).then(onfulfilled, onrejected);
        }
    };
    return chain;
};

describe('Verify Session API', () => {
    let fastify: FastifyInstance;
    let mockRequest: any;
    let mockReply: any;

    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();

        // Setup Fastify mock? 
        // Or just test the handler logic? 
        // Testing via fastify instance is better integration test, but might be complex to setup with all plugins.
        // Let's rely on standard fastify testing if we can, or just mock the route registration.

        // Actually, let's just create a minimal fastify app to register the route
        const fastifyModule = await import('fastify');
        fastify = fastifyModule.default();

        // Setup Zod
        fastify.setValidatorCompiler(validatorCompiler);
        fastify.setSerializerCompiler(serializerCompiler);

        fastify.register(paymentsRoutes); // Register our plugin

        await fastify.ready();
    });

    it('should successfully verify a new session', async () => {
        const sessionId = 'cs_test_123';
        const priceId = 'price_123';
        const planId = 'plan_123';

        // 1. Stripe Session Mock
        mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
            id: sessionId,
            payment_status: 'paid',
            status: 'complete',
            customer: 'cus_123',
            metadata: { priceId } // fallback if line_items fail
        });

        // 2. Idempotency Mock (No existing payment)
        mockDb.select.mockReturnValueOnce(createDbChain([]));

        // 3. Resolve Plan & Price
        // Expanded session mock
        mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
            id: sessionId,
            line_items: { data: [{ price: { id: priceId } }] },
            subscription: { id: 'sub_new', current_period_end: 9999999999 }
        });

        // Plan Lookup Mock
        mockDb.select.mockReturnValueOnce(createDbChain([{
            id: planId,
            name: 'Pro Plan',
            price: 1000,
            currency: 'usd',
            credits: 100,
            interval: 'month',
            credits_interval: 'month'
        }]));

        // 4. Transaction Mocks
        // A. Concurrency Check (Select 1 in TX)
        mockDb.select.mockReturnValueOnce(createDbChain([]));

        // B. recordPaymentHistory (Select 2 in TX)
        mockDb.select.mockReturnValueOnce(createDbChain([]));
        // PaymentHistory Insert
        mockDb.insert.mockReturnValue(createDbChain([]));

        // C. handleSubscriptionUpdate
        // Check for OTHER active subs (Select 3 in TX)
        mockDb.select.mockReturnValueOnce(createDbChain([])); // No old subs
        // Check for THIS sub (Select 4 in TX)
        mockDb.select.mockReturnValueOnce(createDbChain([])); // New sub (not in DB yet)
        // Insert Sub
        mockDb.insert.mockReturnValue(createDbChain([]));
        // Mark others non-current
        mockDb.update.mockReturnValue(createDbChain([]));

        // D. handleCreditUpdate
        // Check balance (Select 5 in TX)
        mockDb.select.mockReturnValueOnce(createDbChain([])); // No balance
        // Insert balance
        mockDb.insert.mockReturnValue(createDbChain([]));
        // Insert transaction
        mockDb.insert.mockReturnValue(createDbChain([]));

        // 5. User Update (Stripe Customer ID)
        mockDb.update.mockReturnValue(createDbChain([]));


        const response = await fastify.inject({
            method: 'POST',
            url: '/verify-session',
            payload: { sessionId }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ success: true, verified: true });

        expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(sessionId);
        expect(mockEmail.sendSubscriptionEmail).toHaveBeenCalled();
    });

    it('should handle idempotency (already processed)', async () => {
        const sessionId = 'cs_test_already_processed';

        mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
            id: sessionId,
            payment_status: 'paid'
        });

        // Idempotency: Found existing successful payment
        mockDb.select.mockReturnValueOnce(createDbChain([{ status: 'succeeded' }]));

        const response = await fastify.inject({
            method: 'POST',
            url: '/verify-session',
            payload: { sessionId }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            success: true,
            verified: true,
            message: 'Already processed'
        });
    });

    it('should cancel existing old subscription if new one is verified', async () => {
        const sessionId = 'cs_test_replace_sub';
        const priceId = 'price_pro';

        // ... Session Mocks ...
        mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({ payment_status: 'paid' });

        // Idempotency
        mockDb.select.mockReturnValueOnce(createDbChain([]));

        // Expanded Session
        mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
            line_items: { data: [{ price: { id: priceId } }] },
            subscription: { id: 'sub_new' }
        });

        // Plan Lookup
        mockDb.select.mockReturnValueOnce(createDbChain([{
            id: 'plan_pro', interval: 'month', credits: 100, price: 1000
        }]));

        // Transaction start...
        // 1. Concurrency Check
        mockDb.select.mockReturnValueOnce(createDbChain([]));

        // 2. recordPaymentHistory check
        mockDb.select.mockReturnValueOnce(createDbChain([]));

        // PaymentHistory Insert
        mockDb.insert.mockReturnValue(createDbChain([]));

        // --- Handle Subscription Update ---
        // 3. Find OTHER active subs -> Return one old sub
        mockDb.select.mockReturnValueOnce(createDbChain([{
            id: 'sub_old_db_id',
            stripeSubscriptionId: 'sub_old',
            status: 'active'
        }]));

        // 4. Check for THIS new sub -> Enpty
        mockDb.select.mockReturnValueOnce(createDbChain([]));

        // 5. Insert new sub
        mockDb.insert.mockReturnValue(createDbChain([]));

        // 6. Mark others non-current
        mockDb.update.mockReturnValue(createDbChain([]));

        // --- Credits ---
        // 7. Check Balance
        mockDb.select.mockReturnValueOnce(createDbChain([]));
        mockDb.insert.mockReturnValue(createDbChain([]));
        mockDb.insert.mockReturnValue(createDbChain([]));
        // ...

        const response = await fastify.inject({
            method: 'POST',
            url: '/verify-session',
            payload: { sessionId }
        });

        expect(response.statusCode).toBe(200);

        // Verify Cancellation called
        expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_old');
        // Verify DB update status = cancelled
        // We can't easily check the exact chain call args with this simple mock, but we know the flow reached there.
    });

    it('should return 400 if payment not paid', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
            payment_status: 'unpaid'
        });

        const response = await fastify.inject({
            method: 'POST',
            url: '/verify-session',
            payload: { sessionId: 'cs_unpaid' }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: 'Payment not completed' });
    });

    it('should handle concurrent requests for same session (In-Memory Lock)', async () => {
        const sessionId = 'cs_test_concurrent';

        // Mock success for the first one that gets through
        mockStripe.checkout.sessions.retrieve.mockResolvedValue({
            id: sessionId,
            payment_status: 'paid',
            customer: 'cus_concurrent',
            line_items: { data: [{ price: { id: 'price_c' } }] },
            subscription: { id: 'sub_c' }
        });

        mockDb.select.mockReturnValue(createDbChain([{
            id: 'plan_c', credits: 10, price: 500, name: 'Concurrent Plan'
        }]));
        mockDb.insert.mockReturnValue(createDbChain([]));
        mockDb.update.mockReturnValue(createDbChain([]));
        mockDb.transaction.mockImplementation(async (cb) => {
            // Simulate slight delay in transaction to allow second request to hit lock
            await new Promise(resolve => setTimeout(resolve, 100));
            return cb(mockDb);
        });

        // Fire two requests concurrently
        const p1 = fastify.inject({
            method: 'POST',
            url: '/verify-session',
            payload: { sessionId }
        });

        const p2 = fastify.inject({
            method: 'POST',
            url: '/verify-session',
            payload: { sessionId }
        });

        const [r1, r2] = await Promise.all([p1, p2]);

        // One should succeed with verification, the other with "Verification in progress" or just verified idempotently if it finished fast.
        // But with delay, one should hit the lock.

        const responses = [r1.json(), r2.json()];
        const lockedResponse = responses.find(r => r.message === 'Verification in progress');
        const successResponse = responses.find(r => !r.message);

        expect(lockedResponse).toBeDefined();
        expect(successResponse).toBeDefined();
        expect(successResponse).toEqual({ success: true, verified: true });
    });
});
