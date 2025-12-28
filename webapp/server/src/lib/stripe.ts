import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
    typescript: true,
});

/**
 * Helper to create a Stripe Checkout Session
 */
export async function createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    clientReferenceId,
    userEmail,
    mode = 'subscription',
    metadata = {},
}: {
    customerId?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    clientReferenceId: string;
    userEmail?: string;
    mode?: 'subscription' | 'payment';
    metadata?: Record<string, any>;
}) {
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: clientReferenceId,
        ...(mode === 'subscription' ? {
            subscription_data: {
                metadata: {
                    userId: clientReferenceId,
                    ...metadata,
                },
            },
        } : {
            payment_intent_data: {
                metadata: {
                    userId: clientReferenceId,
                    ...metadata,
                },
            }
        }),
    });

    return session;
}

/**
 * Helper to create a Stripe Customer Portal Session
 */
export async function createPortalSession({
    customerId,
    returnUrl,
}: {
    customerId: string;
    returnUrl: string;
}) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session;
}
