import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { subscriptionPlan, userSubscription, user, paymentHistory, creditBalance, creditTransaction } from "../db/schema.js";
import { eq, desc, and, sql, or, ne, isNull } from "drizzle-orm";
import { z } from "zod";
import { stripe, createCheckoutSession, createPortalSession } from "../lib/stripe.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "node:crypto";
import { sendSubscriptionEmail } from "../lib/email.js";

const PLANS_SCHEMA = z.object({});
const CHECKOUT_SCHEMA = z.object({
    priceId: z.string(),
});

const activeVerifications = new Set<string>();

interface PaymentContext {
    log: (msg: string, data?: any) => void;
    logError: (msg: string, error: any) => void;
    userId: string;
    spanId: string;
}

// --- Helper Functions ---

async function verifyStripeSession(ctx: PaymentContext, sessionId: string) {
    ctx.log(`Retrieving session from Stripe...`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    ctx.log(`Session retrieved`, { paymentStatus: session.payment_status, status: session.status });

    if (session.payment_status !== 'paid') {
        const error: any = new Error("Payment not completed");
        error.statusCode = 400;
        throw error;
    }
    return session;
}

async function checkIdempotency(ctx: PaymentContext, sessionId: string) {
    ctx.log(`Checking idempotency in DB...`);
    const [existingPayment] = await db.select()
        .from(paymentHistory)
        .where(or(
            eq(paymentHistory.stripePaymentId, sessionId),
            sql`${paymentHistory.metadata}->>'checkoutSessionId' = ${sessionId}`
        ))
        .limit(1);

    if (existingPayment && existingPayment.status === 'succeeded') {
        ctx.log(`Payment already processed successfully`);
        return true;
    }
    return false;
}

async function resolvePlanAndPrice(ctx: PaymentContext, session: any) {
    ctx.log(`Retrieving expanded session details...`);
    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'subscription'],
    });
    const lineItem = expandedSession.line_items?.data[0];
    const priceId = lineItem?.price?.id || session.metadata?.priceId;

    if (!priceId) {
        throw new Error("Could not determine priceId from session");
    }

    ctx.log(`Looking up plan for priceId: ${priceId}`);
    const [plan] = await db.select()
        .from(subscriptionPlan)
        .where(eq(subscriptionPlan.stripePriceId, priceId))
        .limit(1);

    if (!plan) {
        throw new Error(`Plan not found for priceId: ${priceId}`);
    }

    let periodEnd: Date | null = null;
    const subscriptionId = expandedSession.subscription && typeof expandedSession.subscription !== 'string'
        ? (expandedSession.subscription as any).id
        : (expandedSession.subscription as string);

    if (plan.interval) {
        const sub = expandedSession.subscription as any;
        if (sub && typeof sub !== 'string') {
            const ts = sub.current_period_end;
            if (typeof ts === 'number') {
                periodEnd = new Date(ts * 1000);
            }
        }
    }

    return { plan, priceId, subscriptionId, periodEnd, expandedSession };
}

async function handleSubscriptionUpdate(
    ctx: PaymentContext,
    tx: any,
    userId: string,
    planData: { plan: any; subscriptionId: string; periodEnd: Date | null }
) {
    const { plan, subscriptionId, periodEnd } = planData;

    if (plan.interval && subscriptionId) {
        ctx.log(`Transaction: Handling subscription update...`);

        // 1. Cancel/Mark non-current ALL other active subscriptions
        // "We want to make sure if we are verifying and found exising sub for user and trying to subscribe other then we first cancel that."
        // We will query for any existing active/trialing subscriptions that are NOT this new one.

        const existingSubs = await tx.select()
            .from(userSubscription)
            .where(and(
                eq(userSubscription.userId, userId),
                ne(userSubscription.stripeSubscriptionId, subscriptionId), // Don't cancel the one we are about to insert/update if it exists
                or(
                    eq(userSubscription.status, 'active'),
                    eq(userSubscription.status, 'trialing')
                )
            ));

        for (const oldSub of existingSubs) {
            ctx.log(`Cancelling previous subscription ${oldSub.id} (${oldSub.stripeSubscriptionId})`);

            // Cancel in Stripe to be safe, though webhook might handle it too.
            // Best practice: if user is switching plans via checkout, Stripe usually handles "updates" but if this is a fresh checkout session, it creates a NEW sub.
            // So we must cancel the old one to avoid double billing.
            if (oldSub.stripeSubscriptionId) {
                try {
                    await stripe.subscriptions.cancel(oldSub.stripeSubscriptionId);
                } catch (err: any) {
                    ctx.logError(`Failed to cancel old stripe subscription ${oldSub.stripeSubscriptionId}`, err);
                    // Continue anyway to update DB
                }
            }

            await tx.update(userSubscription)
                .set({
                    status: 'cancelled',
                    isCurrent: false,
                    updatedAt: new Date()
                })
                .where(eq(userSubscription.id, oldSub.id));
        }

        // 2. Insert or Update the NEW subscription
        const [existingNewSub] = await tx.select()
            .from(userSubscription)
            .where(eq(userSubscription.stripeSubscriptionId, subscriptionId))
            .limit(1);

        if (existingNewSub) {
            ctx.log(`Transaction: Updating existing subscription record ${existingNewSub.id}`);
            await tx.update(userSubscription)
                .set({
                    status: 'active',
                    planId: plan.id,
                    currentPeriodEnd: periodEnd,
                    updatedAt: new Date(),
                    isCurrent: true
                })
                .where(eq(userSubscription.id, existingNewSub.id));
        } else {
            ctx.log(`Transaction: Creating new subscription record`);
            await tx.insert(userSubscription).values({
                id: randomUUID(),
                userId,
                planId: plan.id,
                stripeSubscriptionId: subscriptionId,
                status: 'active',
                currentPeriodEnd: periodEnd,
                createdAt: new Date(),
                updatedAt: new Date(),
                isCurrent: true
            });
        }

        // Ensure strictly only one isCurrent=true (cleanup any potential consistency issues)
        await tx.update(userSubscription)
            .set({ isCurrent: false })
            .where(and(
                eq(userSubscription.userId, userId),
                ne(userSubscription.stripeSubscriptionId, subscriptionId)
            ));
    }
}

async function handleCreditUpdate(
    ctx: PaymentContext,
    tx: any,
    userId: string,
    plan: any
) {
    ctx.log(`Transaction: Adding ${plan.credits} credits...`);

    // Get or Create Balance
    const [balance] = await tx.select()
        .from(creditBalance)
        .where(eq(creditBalance.userId, userId))
        .limit(1);

    let balanceId: string;

    if (balance) {
        balanceId = balance.id;
        await tx.update(creditBalance)
            .set({
                amountTotal: balance.amountTotal + plan.credits,
                updatedAt: new Date()
            })
            .where(eq(creditBalance.id, balance.id));
    } else {
        balanceId = randomUUID();
        await tx.insert(creditBalance).values({
            id: balanceId,
            userId,
            amountTotal: plan.credits,
            amountUsed: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    // Log Transaction
    await tx.insert(creditTransaction).values({
        id: randomUUID(),
        userId,
        creditBalanceId: balanceId,
        amount: plan.credits,
        description: `Purchase of ${plan.name}`,
        createdAt: new Date()
    });
}

async function recordPaymentHistory(
    ctx: PaymentContext,
    tx: any,
    userId: string,
    planData: { plan: any; priceId: string; subscriptionId: string | null },
    sessionId: string
) {
    const { plan, priceId, subscriptionId } = planData;

    // Check if record exists (from pending state)
    const [record] = await tx.select()
        .from(paymentHistory)
        .where(or(
            eq(paymentHistory.stripePaymentId, sessionId),
            sql`${paymentHistory.metadata}->>'checkoutSessionId' = ${sessionId}`
        ))
        .limit(1);

    const paymentData = {
        userId,
        amount: plan.price,
        currency: plan.currency,
        status: 'succeeded',
        stripePaymentId: sessionId,
        metadata: {
            checkoutSessionId: sessionId,
            priceId: priceId,
            planId: plan.id,
            subscriptionId: subscriptionId
        },
        updatedAt: new Date()
    };

    if (record) {
        ctx.log(`Transaction: Updating existing payment record ${record.id}`);
        await tx.update(paymentHistory)
            .set(paymentData)
            .where(eq(paymentHistory.id, record.id));
    } else {
        ctx.log(`Transaction: Creating new payment record`);
        await tx.insert(paymentHistory).values({
            id: randomUUID(),
            ...paymentData,
            createdAt: new Date()
        });
    }
}



export default async function paymentsRoutes(fastify: FastifyInstance) {
    // GET /api/payments/plans
    fastify.get("/plans", {
        schema: {
            response: {
                200: z.array(z.any())
            }
        }
    }, async (request, reply) => {
        const userId = request.user?.id;
        console.log(`[GET /plans] User ID: ${userId || 'Unauthenticated'}`);
        let planTag: string | null = null;

        // Fetch fresh user data to get planTag only if logged in
        if (userId) {
            try {
                const [userRecord] = await db.select()
                    .from(user)
                    .where(eq(user.id, userId))
                    .limit(1);

                if (userRecord) {
                    // console.log(`[GET /plans] User found: ${userRecord.id}, Current Tag: ${userRecord.planTag}`);
                    if (userRecord.planTag) {
                        const expiresAt = userRecord.planTagExpiresAt ? new Date(userRecord.planTagExpiresAt) : null;
                        const now = new Date();
                        if (!expiresAt || expiresAt > now) {
                            planTag = userRecord.planTag;
                            console.log(`[GET /plans] Applying active plan tag: ${planTag}`);
                        } else {
                            console.log(`[GET /plans] Plan tag expired at ${expiresAt}`);
                        }
                    }
                } else {
                    console.warn(`[GET /plans] User ID ${userId} in session but not found in DB`);
                }
            } catch (err) {
                console.error(`[GET /plans] Error fetching user data:`, err);
            }
        }

        const tagCondition = planTag
            ? or(eq(subscriptionPlan.tag, planTag), isNull(subscriptionPlan.tag))
            : isNull(subscriptionPlan.tag);

        console.log(`[GET /plans] Querying plans with tag condition: ${planTag ? `tag=${planTag} OR null` : 'tag=null'}`);

        const plans = await db.select()
            .from(subscriptionPlan)
            .where(
                and(
                    eq(subscriptionPlan.isActive, true),
                    tagCondition
                )
            );

        console.log(`[GET /plans] Found ${plans.length} plans`);
        return plans;
    });

    // POST /api/payments/create-checkout-session
    fastify.post("/create-checkout-session", {
        preHandler: [requireAuth],
        schema: {
            body: CHECKOUT_SCHEMA
        }
    }, async (request: FastifyRequest<{ Body: { priceId: string; metadata?: any } }>, reply) => {
        const { priceId, metadata } = request.body;
        const currentUser = request.user;
        const userId = currentUser.id;

        try {
            console.log(`[Payment] Creating checkout session for user ${userId}, priceId: ${priceId}`);

            // 1. Fetch Plan Details
            const [plan] = await db.select()
                .from(subscriptionPlan)
                .where(eq(subscriptionPlan.stripePriceId, priceId))
                .limit(1);

            if (!plan) {
                console.warn(`[Payment] Plan not found for priceId: ${priceId}`);
                return reply.status(404).send({ error: "Plan not found" });
            }

            // 2. Check for active subscription (Prevent duplicate subs if already on THIS plan)
            const [existingSub] = await db.select()
                .from(userSubscription)
                .where(and(
                    eq(userSubscription.userId, userId),
                    eq(userSubscription.planId, plan.id),
                    eq(userSubscription.status, 'active')
                ))
                .limit(1);

            if (existingSub) {
                console.info(`[Payment] User ${userId} already has active subscription for plan ${plan.id}`);
                return reply.status(400).send({ error: "You are already subscribed to this plan" });
            }

            // 3. Create Session
            // Reuse existing pending session logic...
            // Check for recent pending session for this exact price
            const [existingPending] = await db.select()
                .from(paymentHistory)
                .where(and(
                    eq(paymentHistory.userId, userId),
                    sql`${paymentHistory.metadata}->>'priceId' = ${priceId}`,
                    eq(paymentHistory.status, 'pending')
                    // Check if created within last 20 hours to be safe (Stripe sessions expire in ~24h)
                ))
                .orderBy(desc(paymentHistory.createdAt))
                .limit(1);

            let sessionUrl: string | null = null;
            let sessionId: string | null = null;

            if (existingPending && existingPending.metadata) {
                const meta = existingPending.metadata as any;
                if (meta.checkoutUrl && meta.checkoutSessionId) {
                    // Verify if it's still valid in Stripe?
                    // For speed optimization we can assume it returns valid if < 20h.
                    // But if user cancelled it in UI, reusing might show "Expired".
                    // Ideally we check Stripe.
                    try {
                        const session = await stripe.checkout.sessions.retrieve(meta.checkoutSessionId);
                        if (session.status === 'open') {
                            console.log(`[Payment] Reusing existing session ${session.id} for user ${userId}`);
                            sessionUrl = session.url;
                            sessionId = session.id;
                        } else {
                            // It's expired or completed, ignore
                        }
                    } catch (err) {
                        // Ignore error, create new one
                        console.warn(`[Payment] Failed to retrieve existing session ${meta.checkoutSessionId} for user ${userId}:`, err);
                    }
                }
            }

            if (!sessionUrl) {
                const session = await createCheckoutSession({
                    customerId: currentUser.stripeCustomerId!,
                    priceId,
                    successUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/settings/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/settings/pricing?canceled=true`,
                    clientReferenceId: userId,
                    mode: plan.interval ? 'subscription' : 'payment',
                    metadata: {
                        planId: plan.id, // Store our DB plan ID
                        credits: plan.credits,
                        isSubscription: !!plan.interval,
                        ...metadata // Merge any additional metadata from the request body
                    }
                });
                sessionUrl = session.url;
                sessionId = session.id;
                console.log(`[Payment] Created NEW session ${sessionId} for user ${userId}`);
            }

            if (!sessionUrl) {
                throw new Error("Failed to create Stripe session URL");
            }

            // 4. Log "Pending" Payment
            // If reusing, we could update or just leave it.
            // If new, insert.
            // Let's insert a log for tracking attempts or update logic?
            // The prompt "Insert paymentHistory record with status pending" implies new record.
            // But if we reuse, we duplicate pending records?
            // Better to only insert if we created a NEW session.
            if (!existingPending || existingPending.metadata && (existingPending.metadata as any).checkoutSessionId !== sessionId) {
                await db.insert(paymentHistory).values({
                    id: randomUUID(),
                    userId,
                    amount: plan.price,
                    currency: plan.currency,
                    status: 'pending',
                    stripePaymentId: sessionId, // Store session ID as payment ref for now
                    metadata: {
                        checkoutUrl: sessionUrl,
                        checkoutSessionId: sessionId,
                        priceId: priceId
                    }
                });
            }

            return { url: sessionUrl };
        } catch (error: any) {
            console.error(`[Payment] Error creating checkout session for user ${userId}:`, error);
            // Include stack trace in dev/staging if helpful, or just message
            return reply.status(500).send({
                error: "Failed to create checkout session",
                details: error.message
            });
        }
    });

    // POST /api/payments/verify-session
    fastify.post("/verify-session", {
        preHandler: [requireAuth],
        schema: {
            body: z.object({
                sessionId: z.string()
            })
        }
    }, async (request: FastifyRequest<{ Body: { sessionId: string } }>, reply) => {
        const { sessionId } = request.body;
        const currentUser = request.user;
        const userId = currentUser.id;
        const spanId = randomUUID().substring(0, 8); // Short span ID for readability

        if (activeVerifications.has(sessionId)) {
            console.log(`[Payment][Verify] Session ${sessionId} is currently being verified. Skipping duplicate request.`);
            return reply.send({ success: true, verified: true, message: "Verification in progress" });
        }
        activeVerifications.add(sessionId);

        const ctx: PaymentContext = {
            log: (msg: string, data?: any) => {
                const prefix = `[Payment][Verify][${userId}][${spanId}]`;
                if (data) {
                    console.log(`${prefix} ${msg}`, JSON.stringify(data, null, 2));
                } else {
                    console.log(`${prefix} ${msg}`);
                }
            },
            logError: (msg: string, error: any) => {
                const prefix = `[Payment][Verify][${userId}][${spanId}]`;
                console.error(`${prefix} [ERROR] ${msg}`, error);
            },
            userId,
            spanId
        };

        ctx.log(`Starting session verification`, { sessionId });

        if (!sessionId) {
            ctx.logError("Session ID is missing in request", null);
            return reply.status(400).send({ error: "Session ID is required" });
        }

        try {
            // 1. Retrieve session from Stripe
            const session = await verifyStripeSession(ctx, sessionId);

            // 2. Check if already processed (Idempotency)
            const alreadyProcessed = await checkIdempotency(ctx, sessionId);
            if (alreadyProcessed) {
                return { success: true, verified: true, message: "Already processed" };
            }

            // 3. Resolve Plan and Details
            const planData = await resolvePlanAndPrice(ctx, session);
            const { plan } = planData;

            ctx.log(`Plan found: ${plan.name} (${plan.id}), Credits: ${plan.credits}`);

            // 4. Atomic Database Transaction
            ctx.log(`Starting atomic database transaction...`);
            await db.transaction(async (tx) => {
                // Re-verify status inside transaction for safety
                const [record] = await tx.select()
                    .from(paymentHistory)
                    .where(or(
                        eq(paymentHistory.stripePaymentId, sessionId),
                        sql`${paymentHistory.metadata}->>'checkoutSessionId' = ${sessionId}`
                    ))
                    .limit(1);

                if (record && record.status === 'succeeded') {
                    ctx.log(`Transaction: Record already succeeded, aborting...`);
                    return; // Already processed by concurrent request
                }

                await recordPaymentHistory(ctx, tx, userId, planData, sessionId);
                await handleSubscriptionUpdate(ctx, tx, userId, planData);
                await handleCreditUpdate(ctx, tx, userId, plan);
            });
            ctx.log(`Database transaction completed successfully`);

            // 5. Post-Transaction: Association & Communication
            try {
                if (currentUser.stripeCustomerId !== session.customer && session.customer) {
                    ctx.log(`Updating Stripe Customer ID on user...`);
                    await db.update(user)
                        .set({ stripeCustomerId: session.customer as string })
                        .where(eq(user.id, userId));
                }
            } catch (err) {
                ctx.logError(`Failed to update customer ID association`, err);
            }

            // 6. Send Email
            try {
                if (currentUser.email) {
                    ctx.log(`Sending confirmation email to ${currentUser.email}...`);
                    const cost = `$${(plan.price / 100).toFixed(2)}`;
                    const nextBillingDate = planData.periodEnd ? planData.periodEnd.toLocaleDateString() : 'One-time';

                    await sendSubscriptionEmail(
                        currentUser.email,
                        currentUser.name || "User",
                        plan.name,
                        cost,
                        nextBillingDate
                    );
                    ctx.log(`Email sent successfully`);
                }
            } catch (err) {
                ctx.logError(`Failed to send confirmation email`, err);
            }

            ctx.log(`Verification process finished successfully`);
            return { success: true, verified: true };

        } catch (error: any) {
            ctx.logError(`Error verifying session`, error);
            const statusCode = (error as any).statusCode || 500;
            if (statusCode < 500) {
                return reply.status(statusCode).send({ error: error.message });
            }
            return reply.status(500).send({
                error: "Failed to verify session",
                details: error.message
            });
        } finally {
            activeVerifications.delete(sessionId);
        }
    });

    const cancelAllSubscriptions = async (userId: string, atPeriodEnd: boolean = false) => {
        const existingActiveSubs = await db.select()
            .from(userSubscription)
            .where(and(
                eq(userSubscription.userId, userId),
                or(
                    eq(userSubscription.status, 'active'),
                    eq(userSubscription.status, 'trialing')
                )
            ));

        const results = {
            total: existingActiveSubs.length,
            cancelled: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const oldSub of existingActiveSubs) {
            try {
                if (oldSub.stripeSubscriptionId) {
                    console.log(`[Payment] Cancelling subscription ${oldSub.stripeSubscriptionId} for user ${userId} (atPeriodEnd: ${atPeriodEnd})`);
                    try {
                        if (atPeriodEnd) {
                            await stripe.subscriptions.update(oldSub.stripeSubscriptionId, {
                                cancel_at_period_end: true,
                            });
                        } else {
                            await stripe.subscriptions.cancel(oldSub.stripeSubscriptionId);
                        }
                    } catch (err: any) {
                        if (err?.code === 'resource_missing') {
                            console.warn(`Subscription ${oldSub.stripeSubscriptionId} not found in Stripe. Marking as cancelled in DB.`);
                        } else {
                            throw err;
                        }
                    }

                    await db.update(userSubscription)
                        .set({
                            status: 'cancelled',
                            cancelAtPeriodEnd: atPeriodEnd,
                            updatedAt: new Date()
                        })
                        .where(eq(userSubscription.id, oldSub.id));

                    results.cancelled++;
                }
            } catch (err: any) {
                console.error(`Failed to cancel subscription ${oldSub.id}:`, err);
                results.failed++;
                results.errors.push(err.message || `Failed to cancel sub ${oldSub.id}`);
            }
        }
        return results;
    };

    // POST /api/payments/create-portal-session
    fastify.post("/create-portal-session", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        try {
            console.log(`[Payment] Creating portal session for user ${userId}`);

            if (!currentUser.stripeCustomerId) {
                console.warn(`[Payment] User ${userId} has no stripe_customer_id`);
                return reply.status(400).send({ error: "No billing account found" });
            }

            const session = await createPortalSession({
                customerId: currentUser.stripeCustomerId,
                returnUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/settings`
            });

            // Create a temporary history record for portal access? Not really needed.
            // But we could log it.
            // await db.insert(paymentHistory).values({ ... status: 'portal_access' ... });

            return { url: session.url };
        } catch (error: any) {
            console.error(`[Payment] Error creating portal session for user ${userId}:`, error);
            return reply.status(500).send({ error: "Failed to create billing portal session" });
        }
    });

    // POST /api/payments/cancel-subscription
    fastify.post("/cancel-subscription", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        const results = await cancelAllSubscriptions(userId, true);

        if (results.total === 0) {
            console.warn(`[Payment] Cancel request for user ${userId} but no active subscription found`);
            return reply.status(400).send({ error: "No active subscription found" });
        }

        if (results.failed > 0 && results.cancelled === 0) {
            return reply.status(500).send({
                error: "Failed to cancel any subscriptions",
                details: results.errors
            });
        }

        return { success: true, ...results };
    });

    // POST /api/payments/reactivate-subscription
    fastify.post("/reactivate-subscription", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        // Get the cancelled subscription
        const [subscription] = await db.select()
            .from(userSubscription)
            .where(and(
                eq(userSubscription.userId, currentUser.id),
                eq(userSubscription.status, 'cancelled'),
                eq(userSubscription.isCurrent, true)
            ))
            .limit(1);

        if (!subscription || !subscription.stripeSubscriptionId) {
            console.warn(`[Payment] Reactivation request for user ${userId} but no cancelled subscription found`);
            return reply.status(400).send({ error: "No cancelled subscription found" });
        }

        try {
            console.log(`[Payment] Reactivating subscription ${subscription.stripeSubscriptionId} for user ${userId}`);

            // 1. Retrieve current status from Stripe
            const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

            if (stripeSub.status === 'canceled') {
                console.warn(`[Payment] Cannot reactivate fully canceled subscription ${subscription.stripeSubscriptionId} for user ${userId}`);

                // Update local DB to ensure it matches
                await db.update(userSubscription)
                    .set({
                        status: 'cancelled',
                        updatedAt: new Date(),
                    })
                    .where(eq(userSubscription.id, subscription.id));

                return reply.status(400).send({
                    error: "Your subscription has already expired and cannot be reactivated. Please subscribe again to a new plan.",
                    code: "SUBSCRIPTION_EXPIRED"
                });
            }

            // 2. Update Stripe subscription to NOT cancel at period end
            const updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: false,
            });

            console.log("Reactivation Stripe Response:", JSON.stringify(updatedStripeSubscription, null, 2));

            let newPeriodEnd: Date;
            const stripePeriodEnd = (updatedStripeSubscription as any).current_period_end ||
                (updatedStripeSubscription as any).items?.data?.[0]?.current_period_end;

            if (stripePeriodEnd && typeof stripePeriodEnd === 'number') {
                newPeriodEnd = new Date(stripePeriodEnd * 1000);
            } else {
                console.warn("Could not find valid current_period_end in stripe response, falling back to existing DB value");
                newPeriodEnd = subscription.currentPeriodEnd || new Date();
            }

            // Final safety check
            if (isNaN(newPeriodEnd.getTime())) {
                console.error("Calculated newPeriodEnd is Invalid Date. Fallback to now.");
                newPeriodEnd = new Date();
            }

            // Update database with fresh data from Stripe
            await db.update(userSubscription)
                .set({
                    status: 'active',
                    cancelAtPeriodEnd: false,
                    currentPeriodEnd: newPeriodEnd,
                    updatedAt: new Date(),
                })
                .where(eq(userSubscription.id, subscription.id));

            return { success: true };
        } catch (error: any) {
            console.error(`[Payment] Reactivation error for user ${userId}:`, error);
            // Include user context in error message if needed, or just standard 500
            return reply.status(500).send({
                error: error.message || "Failed to reactivate subscription",
                code: "REACTIVATION_FAILED"
            });
        }
    });

    // GET /api/payments/subscription
    fastify.get("/subscription", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        try {
            const [subscription] = await db.select()
                .from(userSubscription)
                .where(and(
                    eq(userSubscription.userId, currentUser.id),
                    eq(userSubscription.isCurrent, true)
                ))
                .limit(1);

            // Get usage from credit_balance regardless of subscription status
            const [balance] = await db.select()
                .from(creditBalance)
                .where(eq(creditBalance.userId, currentUser.id))
                .limit(1);

            if (!subscription) {
                if (balance) {
                    return {
                        status: 'none',
                        subscription: null,
                        usage: {
                            used: balance.amountUsed,
                            total: balance.amountTotal,
                            resetsAt: balance.expiresAt || null
                        }
                    };
                }
                return { status: 'none', subscription: null, usage: null };
            }

            const [plan] = await db.select()
                .from(subscriptionPlan)
                .where(eq(subscriptionPlan.id, subscription.planId))
                .limit(1);

            return {
                status: subscription.status,
                planName: plan?.name,
                planPrice: plan?.price,
                interval: plan?.interval,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                usage: balance ? {
                    used: balance.amountUsed,
                    total: balance.amountTotal,
                    resetsAt: balance.expiresAt || subscription.currentPeriodEnd
                } : null,
                subscription: subscription // Return full object if needed by frontend types
            };
        } catch (error: any) {
            console.error(`[Payment] Error fetching subscription for user ${userId}:`, error);
            return reply.status(500).send({ error: "Failed to fetch subscription details" });
        }
    });

    // GET /api/payments/invoices
    fastify.get("/invoices", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        try {
            const invoices = await db.select()
                .from(paymentHistory)
                .where(and(
                    eq(paymentHistory.userId, currentUser.id),
                    eq(paymentHistory.status, 'succeeded')
                ))
                .orderBy(desc(paymentHistory.createdAt))
                .limit(10);

            return invoices.map(inv => ({
                id: inv.id,
                number: inv.metadata && (inv.metadata as any).invoiceNumber
                    ? (inv.metadata as any).invoiceNumber
                    : (inv.stripePaymentId ? inv.stripePaymentId.slice(-8).toUpperCase() : 'DRAFT'),
                amount_paid: inv.amount,
                currency: inv.currency,
                status: inv.status,
                created: inv.createdAt ? Math.floor(new Date(inv.createdAt).getTime() / 1000) : 0,
                invoice_pdf: ''
            }));
        } catch (error: any) {
            console.error(`[Payment] Error fetching invoices for user ${userId}:`, error);
            return reply.status(500).send({ error: "Failed to fetch invoices" });
        }
    });

    // GET /api/payments/credit-balance-history
    fastify.get("/credit-balance-history", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        try {
            const transactions = await db.select()
                .from(creditTransaction)
                .where(eq(creditTransaction.userId, currentUser.id))
                .orderBy(desc(creditTransaction.createdAt))
                .limit(10);

            const history = transactions.map(t => ({
                id: t.id,
                name: t.description || (t.amount > 0 ? "Credit Top-up" : "Credit Usage"),
                date: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
                status: "Completed",
                credits: t.amount.toString(),
                type: t.amount > 0 ? 'purchase' : 'usage',
                iconType: t.amount > 0 ? 'plus' : 'video',
                amount: 0
            }));

            return history;
        } catch (error: any) {
            console.error(`[Payment] Error fetching credits history for user ${userId}:`, error);
            return reply.status(500).send({ error: "Failed to fetch credit history" });
        }
    });



}
