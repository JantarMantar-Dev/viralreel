
import { db } from "./index.js";
import { subscriptionPlan } from "./schema.js";
import { randomUUID } from "node:crypto";

const PLANS = [
    {
        name: "Starter Pack (one-time)",
        description: "One-time purchase for starters",
        price: 1499, // $14.99 in cents
        currency: "usd",
        interval: null, // one-time
        credits: 10,
        stripePriceIds: {
            development: "price_1SiKegGsL2ypKmAx6HGfnAoz",
            production: "price_1SjZQiGl5J6aoHf99q2tx27y",
        },
    },
    {
        name: "Creator Plus - Launch Price",
        description: "For serious creators (Launch Discount)",
        price: 3900, // $39.00 in cents
        currency: "usd",
        interval: "month",
        credits: 60,
        stripePriceIds: {
            development: "price_1SiKe0GsL2ypKmAxhHsZGmLf",
            production: "price_1SjZPOGl5J6aoHf9PnphSlry",
        },
    },
    {
        name: "Creator - Launch Price",
        description: "For creators (Launch Discount)",
        price: 2900, // $29.00 in cents
        currency: "usd",
        interval: "month",
        credits: 30,
        stripePriceIds: {
            development: "price_1SiKb4GsL2ypKmAxEe7aF8uV",
            production: "price_1SjZKVGl5J6aoHf92DA6oNco",
        },
    },
    {
        name: "Creator Plus",
        description: "Double the videos. Best deal.",
        price: 5900, // $59.00 in cents
        currency: "usd",
        interval: "month",
        credits: 60,
        stripePriceIds: {
            development: "price_1SiKe0GsL2ypKmAxhHsZGmLf_plus_fixed",
            production: "price_1SjZXtGl5J6aoHf9MrlTre2X",
        },
    },
    {
        name: "Creator",
        description: "Perfect for daily creators.",
        price: 3900, // $39.00 in cents
        currency: "usd",
        interval: "month",
        credits: 30,
        stripePriceIds: {
            development: "price_1SiKb4GsL2ypKmAxEe7aF8uV_standard_fixed",
            production: "price_1SjZXHGl5J6aoHf9KyjZMMpV",
        },
    }
];

export async function seedPlans() {
    const isUpdate = process.argv.includes("--update");
    const env = (process.env.NODE_ENV === "production" ? "production" : "development") as "development" | "production";

    console.log(`🌱 Seeding Subscription Plans (Env: ${env}, Update Mode: ${isUpdate})...`);

    // Validation: Check for duplicate price IDs in the current environment
    const priceIds = PLANS.map(p => p.stripePriceIds[env]);
    const duplicatePriceIds = priceIds.filter((id, index) => priceIds.indexOf(id) !== index);

    if (duplicatePriceIds.length > 0) {
        throw new Error(`❌ Duplicate Stripe Price IDs found for ${env}: ${duplicatePriceIds.join(", ")}. Seeding aborted.`);
    }

    for (const plan of PLANS) {
        const stripePriceId = plan.stripePriceIds[env];

        // Check if plan exists by name OR stripePriceId
        const existingPlans = await db.select()
            .from(subscriptionPlan)
            .where(
                or(
                    eq(subscriptionPlan.name, plan.name),
                    eq(subscriptionPlan.stripePriceId, stripePriceId)
                )
            );

        const existing = existingPlans[0];

        if (existing) {
            if (isUpdate) {
                console.log(`🔹 Updating plan "${plan.name}" (ID: ${existing.id})...`);
                await db.update(subscriptionPlan)
                    .set({
                        name: plan.name, // In case name changed but price ID is same
                        description: plan.description,
                        price: plan.price,
                        currency: plan.currency,
                        interval: plan.interval as "month" | "year" | null,
                        credits: plan.credits,
                        stripePriceId: stripePriceId,
                        updatedAt: new Date(),
                    })
                    .where(eq(subscriptionPlan.id, existing.id));
            } else {
                console.log(`ℹ️ Plan "${plan.name}" already exists. Skipping (use --update to sync).`);
            }
        } else {
            console.log(`✨ Creating plan "${plan.name}"...`);
            await db.insert(subscriptionPlan).values({
                id: randomUUID(),
                name: plan.name,
                description: plan.description,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval as "month" | "year" | null,
                credits: plan.credits,
                stripePriceId: stripePriceId,
                isActive: true,
            });
        }
    }

    console.log("✅ Subscription Plans seeded successfully!");
}

// Execute if run directly
import { fileURLToPath } from 'url';
import { eq, or } from "drizzle-orm"; // Need or for existing check

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedPlans()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
