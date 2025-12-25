import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { subscriptionPlan, userSubscription, user, paymentHistory, creditBalance } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
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

        const successUrl = `${process.env.CLIENT_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.CLIENT_URL}/dashboard/settings`;

        const session = await createCheckoutSession({
            customerId: stripeCustomerId,
            priceId,
            successUrl,
            cancelUrl,
            clientReferenceId: currentUser.id,
            mode,
        });

        return { url: session.url };
    });

    // POST /api/payments/create-portal-session
    fastify.post("/create-portal-session", {
        preHandler: [requireAuth]
    }, async (request, reply) => {
        const currentUser = request.user;

        if (!currentUser.stripeCustomerId) {
            return reply.status(400).send({ error: "No active subscription found", code: "NO_CUSTOMER_ID" });
        }

        const returnUrl = `${process.env.CLIENT_URL}/dashboard/settings`;

        const session = await createPortalSession({
            customerId: currentUser.stripeCustomerId,
            returnUrl,
        });

        return { url: session.url };
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
            .where(eq(paymentHistory.userId, currentUser.id))
            .orderBy(desc(paymentHistory.createdAt));

        return invoices;
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

                    // Get the price and its related plan
                    const stripePriceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;

                    // Note: If line_items isn't expanded, we might need to retrieve the session or just rely on metadata
                    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                        expand: ['line_items', 'subscription'],
                    });

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

                    // 2. Create or Update userSubscription
                    const periodEnd = expandedSession.subscription && typeof expandedSession.subscription !== 'string'
                        ? new Date((expandedSession.subscription as any).current_period_end * 1000)
                        : null;

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

                    // 3. Update credit balance
                    const [existingBalance] = await db.select()
                        .from(creditBalance)
                        .where(and(
                            eq(creditBalance.userId, userId),
                            eq(creditBalance.planId, plan.id)
                        ))
                        .limit(1);

                    if (existingBalance) {
                        await db.update(creditBalance)
                            .set({
                                amountTotal: plan.credits,
                                amountUsed: 0, // Reset for new period/plan? Usually yes for subscriptions
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

                    // 4. Log payment history
                    await db.insert(paymentHistory).values({
                        id: randomUUID(),
                        userId,
                        amount: session.amount_total,
                        currency: session.currency,
                        status: 'succeeded',
                        stripePaymentId: session.payment_intent as string || session.id,
                        metadata: { checkoutSessionId: session.id }
                    });

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
                    const periodEnd = new Date(subscription.current_period_end * 1000);
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
