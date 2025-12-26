import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { subscriptionPlan, userSubscription, user, paymentHistory, creditBalance, creditTransaction } from "../db/schema.js";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { z } from "zod";
import { stripe, createCheckoutSession, createPortalSession } from "../lib/stripe.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "node:crypto";

const PLANS_SCHEMA = z.object({});
const CHECKOUT_SCHEMA = z.object({
    priceId: z.string(),
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function paymentsRoutes(fastify: FastifyInstance) {
    // GET /api/payments/plans
    fastify.get("/plans", {
        schema: {
            response: {
                200: z.array(z.any())
            }
        }
    }, async (request, reply) => {
        const plans = await db.select().from(subscriptionPlan).where(eq(subscriptionPlan.isActive, true));
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

        if (!sessionId) {
            return reply.status(400).send({ error: "Session ID is required" });
        }

        try {
            // 1. Retrieve session from Stripe
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status !== 'paid') {
                return reply.status(400).send({ error: "Payment not completed" });
            }

            // 2. Check if already processed (Idempotency)
            // Use sqlRaw or a specific query if needed, here we check paymentHistory status
            const [existingPayment] = await db.select()
                .from(paymentHistory)
                .where(sql`${paymentHistory.metadata}->>'checkoutSessionId' = ${sessionId}`)
                .limit(1);

            if (existingPayment && existingPayment.status === 'succeeded') {
                return { success: true, message: "Already processed" };
            }

            const [pendingPayment] = await db.select()
                .from(paymentHistory)
                .where(eq(paymentHistory.stripePaymentId, sessionId))
                .limit(1);

            if (pendingPayment && pendingPayment.status === 'succeeded') {
                return { success: true, message: "Already processed" };
            }

            // 3. Process Credits and Subscription (Logic refactored from webhook)
            const userId = currentUser.id;
            const stripePriceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;

            // We might need to expand line_items if not present in basic retrieve
            const expandedSession = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['line_items', 'subscription'],
            });
            console.log("DEBUG: expandedSession.subscription:", JSON.stringify(expandedSession.subscription, null, 2));
            const lineItem = expandedSession.line_items?.data[0];
            const priceId = lineItem?.price?.id;

            if (!priceId) {
                return reply.status(400).send({ error: "Could not determine price" });
            }

            const [plan] = await db.select()
                .from(subscriptionPlan)
                .where(eq(subscriptionPlan.stripePriceId, priceId))
                .limit(1);

            if (!plan) {
                return reply.status(404).send({ error: "Plan not found" });
            }

            let periodEnd: Date | null = null;
            if (plan.interval) {
                const sub = expandedSession.subscription && typeof expandedSession.subscription !== 'string'
                    ? expandedSession.subscription as any
                    : null;

                if (sub) {
                    const ts = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
                    if (typeof ts === 'number') {
                        periodEnd = new Date(ts * 1000);
                    } else {
                        periodEnd = null;
                    }
                } else {
                    periodEnd = null;
                }

                const subscriptionId = expandedSession.subscription && typeof expandedSession.subscription !== 'string'
                    ? expandedSession.subscription.id
                    : expandedSession.subscription as string;

                // Deactivate any EXISTING active subscriptions that are different from the new one
                const existingActiveSubs = await db.select()
                    .from(userSubscription)
                    .where(and(
                        eq(userSubscription.userId, userId),
                        or(
                            eq(userSubscription.status, 'active'),
                            eq(userSubscription.status, 'trialing')
                        )
                    ));

                for (const oldSub of existingActiveSubs) {
                    // If it's a DIFFERENT Stripe subscription ID, cancel it in Stripe and DB
                    if (oldSub.stripeSubscriptionId && oldSub.stripeSubscriptionId !== subscriptionId) {
                        try {
                            console.log(`Cancelling old subscription ${oldSub.stripeSubscriptionId} for user ${userId} due to new subscription ${subscriptionId}`);
                            await stripe.subscriptions.cancel(oldSub.stripeSubscriptionId);

                            await db.update(userSubscription)
                                .set({
                                    status: 'cancelled',
                                    updatedAt: new Date()
                                })
                                .where(eq(userSubscription.id, oldSub.id));
                        } catch (err: any) {
                            // If the subscription is already gone in Stripe (resource_missing),
                            // we should still mark it as cancelled in our DB to keep consistent.
                            if (err?.code === 'resource_missing') {
                                console.warn(`Subscription ${oldSub.stripeSubscriptionId} not found in Stripe. Marking as cancelled in DB.`);
                                await db.update(userSubscription)
                                    .set({
                                        status: 'cancelled',
                                        updatedAt: new Date()
                                    })
                                    .where(eq(userSubscription.id, oldSub.id));
                            } else {
                                console.error(`Failed to cancel old subscription ${oldSub.stripeSubscriptionId}:`, err);
                            }
                        }
                    }
                }

                const [existingSubMap] = await db.select()
                    .from(userSubscription)
                    .where(and(
                        eq(userSubscription.userId, userId),
                        eq(userSubscription.stripeSubscriptionId, subscriptionId) // Match by specific Stripe Sub ID if possible, or fallback
                    ))
                    .limit(1);

                // Decide which record to update:
                // Priority 1: Exact Stripe ID match (we are just updating the same sub)
                // But the schema limits logic? No, schema has `id` PK.

                // Let's rely on Stripe ID matching.
                if (existingSubMap) {
                    await db.update(userSubscription)
                        .set({
                            planId: plan.id,
                            status: 'active',
                            currentPeriodEnd: periodEnd,
                            updatedAt: new Date(),
                        })
                        .where(eq(userSubscription.id, existingSubMap.id));
                } else {
                    // Mark previous subscriptions as not current
                    await db.update(userSubscription)
                        .set({ isCurrent: false })
                        .where(and(
                            eq(userSubscription.userId, userId),
                            eq(userSubscription.isCurrent, true)
                        ));

                    await db.insert(userSubscription).values({
                        id: randomUUID(),
                        userId,
                        planId: plan.id,
                        stripeSubscriptionId: subscriptionId,
                        status: 'active',
                        currentPeriodEnd: periodEnd,
                        isCurrent: true
                    });
                }
            }

            // 3. Update credit balance (Single record per user)
            const [existingBalance] = await db.select()
                .from(creditBalance)
                .where(eq(creditBalance.userId, userId))
                .limit(1);

            if (existingBalance) {
                // Following user's manual edit: adding credits
                const newAmountTotal = plan.credits + existingBalance.amountTotal;

                await db.update(creditBalance)
                    .set({
                        amountTotal: newAmountTotal,
                        expiresAt: periodEnd,
                        updatedAt: new Date(),
                    })
                    .where(eq(creditBalance.id, existingBalance.id));

                // Log the transaction
                await db.insert(creditTransaction).values({
                    id: randomUUID(),
                    userId,
                    creditBalanceId: existingBalance.id,
                    amount: plan.credits,
                    description: `Plan Purchase: ${plan.name}`,
                });
            } else {
                const balanceId = randomUUID();
                await db.insert(creditBalance).values({
                    id: balanceId,
                    userId,
                    amountTotal: plan.credits,
                    amountUsed: 0,
                    expiresAt: periodEnd,
                });

                // Log the transaction
                await db.insert(creditTransaction).values({
                    id: randomUUID(),
                    userId,
                    creditBalanceId: balanceId,
                    amount: plan.credits,
                    description: `Initial Plan Purchase: ${plan.name}`,
                });
            }

            // 4. Update Payment History to Succeeded
            if (pendingPayment) {
                await db.update(paymentHistory)
                    .set({
                        status: 'succeeded',
                        stripePaymentId: expandedSession.payment_intent as string || sessionId // Update to actual PI if available
                    })
                    .where(eq(paymentHistory.id, pendingPayment.id));
            } else {
                // Fallback if pending record wasn't found (shouldn't happen in this flow)
                await db.insert(paymentHistory).values({
                    id: randomUUID(),
                    userId,
                    amount: session.amount_total || 0,
                    currency: session.currency || 'usd',
                    status: 'succeeded',
                    stripePaymentId: expandedSession.payment_intent as string || sessionId,
                    metadata: { checkoutSessionId: sessionId }
                });
            }

            // 5. Send Email (Async)
            // We can invoke the email logic here or assume webhook handles it.
            // To ensure reliability, we can do it here if we want immediate feedback,
            // but usually emails are fine in webhooks. Let's keep email in webhook for now or duplicate safely.
            // For now, let's leave email in webhook,                // 4. Return Success with Redirect
            // If success=true in query, we might want to redirect or just return.
            // The client calls this via fetch, so we return JSON.
            return { success: true, verified: true };

        } catch (error: any) {
            console.error(`[Payment] Verification Error for user ${currentUser.id}:`, error);
            // Log deep details for debugging
            if (error.type === 'StripeError') {
                console.error(`[Payment] Stripe Error Details: ${error.type}, Code: ${error.code}, Param: ${error.param}`);
            }
            return reply.status(500).send({ error: "Internal Server Error during verification" });
        }
    });

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

        // Get the active subscription
        const [subscription] = await db.select()
            .from(userSubscription)
            .where(and(
                eq(userSubscription.userId, currentUser.id),
                eq(userSubscription.status, 'active'), // Note: 'active' status check might be redundant if isCurrent is reliable, but good for safety
                eq(userSubscription.isCurrent, true)
            ))
            .limit(1);

        if (!subscription || !subscription.stripeSubscriptionId) {
            console.warn(`[Payment] Cancel request for user ${userId} but no active subscription found`);
            return reply.status(400).send({ error: "No active subscription found" });
        }

        try {
            console.log(`[Payment] Cancelling subscription ${subscription.stripeSubscriptionId} for user ${userId}`);

            // Check if it exists in Stripe before cancelling?
            // Just try cancelling.
            try {
                await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });
            } catch (stripeError: any) {
                if (stripeError?.code === 'resource_missing') {
                    console.warn(`[Payment] Subscription ${subscription.stripeSubscriptionId} missing in Stripe. Configuring local DB override.`);
                } else {
                    throw stripeError;
                }
            }

            // Update database
            await db.update(userSubscription)
                .set({
                    status: 'cancelled',
                    cancelAtPeriodEnd: true,
                    updatedAt: new Date(),
                })
                .where(eq(userSubscription.id, subscription.id));

            return { success: true };
        } catch (error: any) {
            console.error(`[Payment] Cancellation error for user ${userId}:`, error);
            return reply.status(500).send({ error: error.message || "Failed to cancel subscription" });
        }
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

            if (!subscription) {
                return { status: 'none', subscription: null, usage: null };
            }

            const [plan] = await db.select()
                .from(subscriptionPlan)
                .where(eq(subscriptionPlan.id, subscription.planId))
                .limit(1);

            // Get usage from credit_balance
            // We need to fetch specific balance for this plan or generic?
            // Existing logic matches planId.
            const [balance] = await db.select()
                .from(creditBalance)
                .where(eq(creditBalance.userId, currentUser.id))
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
                .orderBy(desc(paymentHistory.createdAt));

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

    // GET /api/payments/credits-history
    fastify.get("/credits-history", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;
        const userId = currentUser.id;

        try {
            // 1. Fetch successful payments (Top-ups) joined with plans
            const payments = await db.select({
                payment: paymentHistory,
                plan: subscriptionPlan
            })
                .from(paymentHistory)
                .leftJoin(subscriptionPlan, sql`${paymentHistory.metadata}->>'priceId' = ${subscriptionPlan.stripePriceId}`)
                .where(and(
                    eq(paymentHistory.userId, currentUser.id),
                    eq(paymentHistory.status, 'succeeded')
                ))
                .orderBy(desc(paymentHistory.createdAt));

            // 2. Fetch usage transactions
            const transactions = await db.select()
                .from(creditTransaction)
                .where(eq(creditTransaction.userId, currentUser.id))
                .orderBy(desc(creditTransaction.createdAt));

            // 3. Merge and format
            const history = [
                ...payments.map(row => {
                    const p = row.payment;
                    const pl = row.plan;
                    return {
                        id: p.id,
                        name: pl ? `${pl.name} Plan` : "Credit Top-up",
                        date: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
                        status: "Success",
                        credits: pl ? pl.credits.toString() : "0",
                        type: 'purchase',
                        amount: p.amount
                    }
                }),
                ...transactions.map(t => ({
                    id: t.id,
                    name: t.description || "Credit Usage",
                    date: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
                    status: "Completed",
                    credits: Math.abs(t.amount).toString(), // Show usage as positive number in list? Or with sign?
                    // Typically usage is shown as negative, but UI might want absolute.
                    // Let's keep it as string.
                    type: 'usage',
                    amount: 0
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return history;
        } catch (error: any) {
            console.error(`[Payment] Error fetching credits history for user ${userId}:`, error);
            return reply.status(500).send({ error: "Failed to fetch credit history" });
        }
    });

    // POST /api/payments/webhook
    fastify.post("/webhook", {
        config: { rawBody: true },
    }, async (request: any, reply) => {
        const sig = request.headers['stripe-signature'];

        if (!sig || !webhookSecret) {
            console.error("Missing Stripe signature or webhook secret");
            return reply.status(400).send({ error: "Webhook Error: Missing signature or secret" });
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(request.rawBody!, sig, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
        }

        console.log(`Processing Stripe event: ${event.type}`);

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as any;
                    const userId = session.client_reference_id;
                    const subscriptionId = session.subscription;
                    const customerId = session.customer;

                    if (!userId) {
                        console.error("No userId found in checkout session metadata");
                        break;
                    }

                    // IDEMPOTENCY CHECK:
                    // Check if we already processed this session via client-side verification
                    // We check by stripePaymentId which we set to session.id in the pending record
                    const [existingRecord] = await db.select()
                        .from(paymentHistory)
                        .where(eq(paymentHistory.stripePaymentId, session.id))
                        .limit(1);

                    if (existingRecord && existingRecord.status === 'succeeded') {
                        console.log(`Session ${session.id} already processed. Skipping webhook logic.`);
                        break;
                    }

                    // Get the price and its related plan
                    const stripePriceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;

                    // Note: If line_items isn't expanded, we might need to retrieve the session or just rely on metadata
                    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                        expand: ['line_items', 'subscription'],
                    });
                    console.log("Webhook DEBUG: expandedSession.subscription:", JSON.stringify(expandedSession.subscription, null, 2));

                    const lineItem = expandedSession.line_items?.data[0];
                    const priceId = lineItem?.price?.id;

                    if (!priceId) {
                        console.error("Could not determine priceId from session");
                        break;
                    }

                    const [plan] = await db.select()
                        .from(subscriptionPlan)
                        .where(eq(subscriptionPlan.stripePriceId, priceId))
                        .limit(1);

                    if (!plan) {
                        console.error(`No plan found for Stripe Price ID: ${priceId}`);
                        break;
                    }

                    // 1. Update user with stripeCustomerId if not already set
                    await db.update(user)
                        .set({ stripeCustomerId: customerId as string })
                        .where(eq(user.id, userId));

                    // 2. Create or Update userSubscription (only for recurring plans)
                    // If it's a one-time payment, subscriptionId will be null/undefined, and we skip this.
                    let periodEnd: Date | null = null;
                    if (plan.interval) {
                        const sub = expandedSession.subscription && typeof expandedSession.subscription !== 'string'
                            ? expandedSession.subscription as any
                            : null;

                        if (sub) {
                            const ts = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
                            if (typeof ts === 'number') {
                                periodEnd = new Date(ts * 1000);
                            } else {
                                periodEnd = null;
                            }
                        } else {
                            periodEnd = null;
                        }

                        const [existingSub] = await db.select()
                            .from(userSubscription)
                            .where(eq(userSubscription.userId, userId))
                            .limit(1);

                        if (existingSub) {
                            await db.update(userSubscription)
                                .set({
                                    planId: plan.id,
                                    stripeSubscriptionId: subscriptionId as string,
                                    status: 'active',
                                    currentPeriodEnd: periodEnd,
                                    updatedAt: new Date(),
                                })
                                .where(eq(userSubscription.id, existingSub.id));
                        } else {
                            await db.insert(userSubscription).values({
                                id: randomUUID(),
                                userId,
                                planId: plan.id,
                                stripeSubscriptionId: subscriptionId as string,
                                status: 'active',
                                currentPeriodEnd: periodEnd,
                            });
                        }
                    }

                    // 3. Update credit balance (Single record per user)
                    const [existingBalance] = await db.select()
                        .from(creditBalance)
                        .where(eq(creditBalance.userId, userId))
                        .limit(1);

                    if (existingBalance) {
                        const newAmountTotal = plan.credits + existingBalance.amountTotal;

                        await db.update(creditBalance)
                            .set({
                                amountTotal: newAmountTotal,
                                expiresAt: periodEnd,
                                updatedAt: new Date(),
                            })
                            .where(eq(creditBalance.id, existingBalance.id));

                        // Log the transaction
                        await db.insert(creditTransaction).values({
                            id: randomUUID(),
                            userId,
                            creditBalanceId: existingBalance.id,
                            amount: plan.credits,
                            description: `Plan Purchase: ${plan.name} (Webhook)`,
                        });
                    } else {
                        const balanceId = randomUUID();
                        await db.insert(creditBalance).values({
                            id: balanceId,
                            userId,
                            amountTotal: plan.credits,
                            amountUsed: 0,
                            expiresAt: periodEnd,
                        });

                        // Log the transaction
                        await db.insert(creditTransaction).values({
                            id: randomUUID(),
                            userId,
                            creditBalanceId: balanceId,
                            amount: plan.credits,
                            description: `Initial Plan Purchase: ${plan.name} (Webhook)`,
                        });
                    }

                    // 4. Log payment history (Update if pending exists, else Insert)
                    if (existingRecord) {
                        await db.update(paymentHistory).set({
                            status: 'succeeded',
                            stripePaymentId: expandedSession.payment_intent as string || session.id
                        }).where(eq(paymentHistory.id, existingRecord.id));
                    } else {
                        await db.insert(paymentHistory).values({
                            id: randomUUID(),
                            userId,
                            amount: session.amount_total,
                            currency: session.currency,
                            status: 'succeeded',
                            stripePaymentId: session.payment_intent as string || session.id,
                            metadata: { checkoutSessionId: session.id }
                        });
                    }

                    // 5. Send confirmation email
                    const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
                    if (userData) {
                        const { sendSubscriptionEmail } = await import("../lib/email.js");
                        await sendSubscriptionEmail(
                            userData.email,
                            userData.name,
                            plan.name,
                            `$${(session.amount_total / 100).toFixed(2)}`,
                            periodEnd?.toLocaleDateString() || "N/A"
                        );
                    }

                    break;
                }

                case 'customer.subscription.updated': {
                    const subscription = event.data.object as any;
                    let periodEnd: Date | null = null;
                    const ts = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;
                    if (typeof ts === 'number') {
                        periodEnd = new Date(ts * 1000);
                    }
                    const status = subscription.status;
                    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

                    await db.update(userSubscription)
                        .set({
                            status,
                            currentPeriodEnd: periodEnd,
                            cancelAtPeriodEnd,
                            updatedAt: new Date(),
                        })
                        .where(eq(userSubscription.stripeSubscriptionId, subscription.id));

                    break;
                }

                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as any;

                    await db.update(userSubscription)
                        .set({
                            status: 'canceled',
                            updatedAt: new Date(),
                        })
                        .where(eq(userSubscription.stripeSubscriptionId, subscription.id));

                    // Send cancellation email
                    const [sub] = await db.select().from(userSubscription).where(eq(userSubscription.stripeSubscriptionId, subscription.id)).limit(1);
                    if (sub) {
                        const [userData] = await db.select().from(user).where(eq(user.id, sub.userId)).limit(1);
                        const [plan] = await db.select().from(subscriptionPlan).where(eq(subscriptionPlan.id, sub.planId)).limit(1);
                        if (userData && plan) {
                            const { sendSubscriptionCancelledEmail } = await import("../lib/email.js");
                            await sendSubscriptionCancelledEmail(
                                userData.email,
                                userData.name,
                                plan.name,
                                new Date().toLocaleDateString(),
                                sub.currentPeriodEnd?.toLocaleDateString() || "N/A"
                            );
                        }
                    }

                    break;
                }

                case 'invoice.paid': {
                    // Logic for recurring payments logging if needed
                    break;
                }
            }
        } catch (error: any) {
            console.error(`Error processing webhook event ${event.type}:`, error);
            // We still return 200 to Stripe to avoid retries if the signature was valid but our processing failed
            // Unless it's a temporary error, but here we'll log it.
        }

        return reply.status(200).send({ received: true });
    });
}
