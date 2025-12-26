import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { subscriptionPlan, userSubscription, user, paymentHistory, creditBalance, creditTransaction } from "../db/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { stripe, createCheckoutSession, createPortalSession } from "../lib/stripe.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "node:crypto";

const PLANS_SCHEMA = z.object({});
const CHECKOUT_SCHEMA = z.object({
    priceId: z.string(),
});

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
    }, async (request: FastifyRequest<{ Body: z.infer<typeof CHECKOUT_SCHEMA> }>, reply) => {
        const { priceId } = request.body;
        const currentUser = request.user;

        // Fetch plan to determine mode (subscription vs one-time)
        const [plan] = await db.select()
            .from(subscriptionPlan)
            .where(eq(subscriptionPlan.stripePriceId, priceId))
            .limit(1);

        if (!plan) {
            return reply.status(404).send({ error: "Plan not found", code: "PLAN_NOT_FOUND" });
        }

        const mode = plan.interval ? 'subscription' : 'payment';

        // Get or create Stripe customer
        let stripeCustomerId = currentUser.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: currentUser.email,
                name: currentUser.name,
                metadata: {
                    userId: currentUser.id
                }
            });
            stripeCustomerId = customer.id;

            // Update user with stripeCustomerId
            await db.update(user)
                .set({ stripeCustomerId })
                .where(eq(user.id, currentUser.id));
        }

        // Check for existing pending session to reuse
        const pendingPayments = await db.select()
            .from(paymentHistory)
            .where(and(
                eq(paymentHistory.userId, currentUser.id),
                eq(paymentHistory.status, 'pending')
            ));

        let existingRecordToUpdate: any = null;

        for (const record of pendingPayments) {
            const metadata = record.metadata as any;
            if (metadata?.priceId === plan.stripePriceId) {
                // Check if created within last 20 hours
                const isRecent = new Date().getTime() - new Date(record.createdAt!).getTime() < 20 * 60 * 60 * 1000;

                if (isRecent && metadata.checkoutUrl) {
                    console.log(`Reusing existing pending session: ${record.id}`);
                    return { url: metadata.checkoutUrl };
                }

                // If found but expired (or missing URL), mark for update
                existingRecordToUpdate = record;
                break;
            }
        }

        console.log("Creating new checkout session");

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: plan.interval ? 'subscription' : 'payment',
            success_url: `${process.env.CLIENT_URL}/settings/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/settings/billing?canceled=true`,
            customer: currentUser.stripeCustomerId || undefined,
            client_reference_id: currentUser.id,
            subscription_data: plan.interval ? {
                metadata: {
                    userId: currentUser.id,
                    priceId: plan.stripePriceId
                }
            } : undefined,
            metadata: {
                userId: currentUser.id,
                priceId: plan.stripePriceId
            }
        } as any);

        if (!session.url) {
            throw new Error("Failed to create checkout session");
        }

        // Create or Update pending payment record
        const metadata = {
            checkoutSessionId: session.id,
            checkoutUrl: session.url,
            priceId: plan.stripePriceId
        };

        if (existingRecordToUpdate) {
            await db.update(paymentHistory)
                .set({
                    status: 'pending',
                    stripePaymentId: session.id,
                    amount: session.amount_total || plan.price,
                    currency: session.currency || plan.currency,
                    createdAt: new Date(), // Reset timestamp for new window
                    metadata: metadata
                })
                .where(eq(paymentHistory.id, existingRecordToUpdate.id));
        } else {
            await db.insert(paymentHistory).values({
                id: randomUUID(),
                userId: currentUser.id,
                amount: session.amount_total || plan.price,
                currency: session.currency || plan.currency,
                status: 'pending',
                stripePaymentId: session.id, // Store session ID for idempotency
                metadata: metadata
            });
        }

        return { url: session.url };
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

                const [existingSub] = await db.select()
                    .from(userSubscription)
                    .where(eq(userSubscription.userId, userId))
                    .limit(1);

                if (existingSub) {
                    await db.update(userSubscription)
                        .set({
                            planId: plan.id,
                            stripeSubscriptionId: subscriptionId,
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
                        stripeSubscriptionId: subscriptionId,
                        status: 'active',
                        currentPeriodEnd: periodEnd,
                    });
                }
            }

            // Update credit balance
            const [existingBalance] = await db.select()
                .from(creditBalance)
                .where(and(
                    eq(creditBalance.userId, userId),
                    eq(creditBalance.planId, plan.id)
                ))
                .limit(1);

            if (existingBalance) {
                const newAmountTotal = plan.interval
                    ? plan.credits
                    : existingBalance.amountTotal + plan.credits;
                const newAmountUsed = plan.interval ? 0 : existingBalance.amountUsed;

                await db.update(creditBalance)
                    .set({
                        amountTotal: newAmountTotal,
                        amountUsed: newAmountUsed,
                        expiresAt: periodEnd,
                        updatedAt: new Date(),
                    })
                    .where(eq(creditBalance.id, existingBalance.id));
            } else {
                await db.insert(creditBalance).values({
                    id: randomUUID(),
                    userId,
                    planId: plan.id,
                    amountTotal: plan.credits,
                    amountUsed: 0,
                    expiresAt: periodEnd,
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
            // For now, let's leave email in webhook, as it's not critical for the UI response.

            return { success: true };

        } catch (error: any) {
            console.error("Verification failed:", error);
            return reply.status(500).send({ error: "Verification failed", details: error.message });
        }
    });

    // POST /api/payments/create-portal-session
    fastify.post("/create-portal-session", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;

        if (!currentUser.stripeCustomerId) {
            return reply.status(400).send({ error: "No active subscription found", code: "NO_CUSTOMER_ID" });
        }

        const returnUrl = `${process.env.CLIENT_URL}/settings`;

        const session = await createPortalSession({
            customerId: currentUser.stripeCustomerId,
            returnUrl,
        });

        return { url: session.url };
    });

    // POST /api/payments/cancel-subscription
    fastify.post("/cancel-subscription", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;

        // Get the active subscription
        const [subscription] = await db.select()
            .from(userSubscription)
            .where(and(
                eq(userSubscription.userId, currentUser.id),
                eq(userSubscription.status, 'active')
            ))
            .limit(1);

        if (!subscription || !subscription.stripeSubscriptionId) {
            return reply.status(400).send({ error: "No active subscription found" });
        }

        try {
            // Update Stripe subscription to cancel at period end
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });

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
            console.error("Cancellation error:", error);
            return reply.status(500).send({ error: error.message || "Failed to cancel subscription" });
        }
    });

    // GET /api/payments/subscription
    fastify.get("/subscription", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;

        const [subscription] = await db.select()
            .from(userSubscription)
            .where(eq(userSubscription.userId, currentUser.id))
            .limit(1);

        if (!subscription) {
            return { status: 'none' };
        }

        const [plan] = await db.select()
            .from(subscriptionPlan)
            .where(eq(subscriptionPlan.id, subscription.planId))
            .limit(1);

        // Get usage from credit_balance
        const [balance] = await db.select()
            .from(creditBalance)
            .where(and(
                eq(creditBalance.userId, currentUser.id),
                eq(creditBalance.planId, subscription.planId)
            ))
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
                resetsAt: balance.expiresAt
            } : null
        };
    });

    // GET /api/payments/invoices
    fastify.get("/invoices", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;

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
    });

    // GET /api/payments/credits-history
    fastify.get("/credits-history", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;

        // 1. Fetch successful payments (Top-ups) joined with plans to get credit counts
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

        // Note: leftJoin by metadata priceId might be tricky with standard Drizzle. 
        // Let's just fetch plans separately and map in memory for better reliability if needed, 
        // OR rely on the fact that we store priceId in metadata.

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
                    iconType: "plus"
                }
            }),
            ...transactions.map(t => ({
                id: t.id,
                name: t.description || "Credit Usage",
                date: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
                status: "Completed",
                credits: t.amount.toString(),
                iconType: t.amount > 0 ? "plus" : "video"
            }))
        ];

        // Sort by date desc
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // POST /api/payments/webhook
    fastify.post("/webhook", {
        config: { rawBody: true },
    }, async (request: any, reply) => {
        const sig = request.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

                    // 3. Update credit balance
                    const [existingBalance] = await db.select()
                        .from(creditBalance)
                        .where(and(
                            eq(creditBalance.userId, userId),
                            eq(creditBalance.planId, plan.id)
                        ))
                        .limit(1);

                    if (existingBalance) {
                        // For subscriptions: Reset credits (new period)
                        // For one-time packs: Add to existing credits
                        const newAmountTotal = plan.interval
                            ? plan.credits
                            : existingBalance.amountTotal + plan.credits;

                        // For subscriptions: Reset usage to 0
                        // For one-time packs: Keep usage as is (effectively just raising the ceiling)
                        const newAmountUsed = plan.interval ? 0 : existingBalance.amountUsed;

                        await db.update(creditBalance)
                            .set({
                                amountTotal: newAmountTotal,
                                amountUsed: newAmountUsed,
                                expiresAt: periodEnd, // Updates expiry if subscription, null if one-time (stays null)
                                updatedAt: new Date(),
                            })
                            .where(eq(creditBalance.id, existingBalance.id));
                    } else {
                        await db.insert(creditBalance).values({
                            id: randomUUID(),
                            userId,
                            planId: plan.id,
                            amountTotal: plan.credits,
                            amountUsed: 0,
                            expiresAt: periodEnd,
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
