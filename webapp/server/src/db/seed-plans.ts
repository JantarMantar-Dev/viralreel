
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
            production: "price_1SiKegGsL2ypKmAx6HGfnAoz", // TODO: Update with actual prod ID
        },
    },
    {
        name: "Creator Plus",
        description: "For serious creators",
        price: 5900, // $59.00 in cents
        currency: "usd",
        interval: "month",
        credits: 60,
        stripePriceIds: {
            development: "price_1SiKe0GsL2ypKmAxhHsZGmLf",
            production: "price_1SiKe0GsL2ypKmAxhHsZGmLf", // TODO: Update with actual prod ID
        },
    },
    {
        name: "Creator",
        description: "For creators",
        price: 3900, // $39.00 in cents
        currency: "usd",
        interval: "month",
        credits: 30,
        stripePriceIds: {
            development: "price_1SiKb4GsL2ypKmAxEe7aF8uV",
            production: "price_1SiKb4GsL2ypKmAxEe7aF8uV", // TODO: Update with actual prod ID
        },
    }
];

export async function seedPlans() {
    const isUpdate = process.argv.includes("--update");
    const env = (process.env.NODE_ENV === "production" ? "production" : "development") as "development" | "production";

    console.log(`🌱 Seeding Subscription Plans (Env: ${env}, Update Mode: ${isUpdate})...`);

    for (const plan of PLANS) {
        // Check if plan exists by name
        const existingPlans = await db.select().from(subscriptionPlan).where(eq(subscriptionPlan.name, plan.name));
        const existing = existingPlans[0];
        const stripePriceId = plan.stripePriceIds[env];

        if (existing) {
            if (isUpdate) {
                console.log(`🔹 Updating plan "${plan.name}"...`);
                await db.update(subscriptionPlan)
                    .set({
                        description: plan.description,
                        price: plan.price,
                        currency: plan.currency,
                        interval: plan.interval,
                        credits: plan.credits,
                        stripePriceId: stripePriceId,
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
import { eq } from "drizzle-orm"; // Need this for the update check

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedPlans()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
