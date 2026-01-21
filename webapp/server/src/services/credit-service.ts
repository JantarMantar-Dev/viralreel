import { db } from "../db/index.js";
import { creditBalance, creditTransaction } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { AppError } from "../lib/errors.js";

export async function hasEnoughCredits(userId: string, amount: number = 1): Promise<boolean> {
    const [balance] = await db.select()
        .from(creditBalance)
        .where(eq(creditBalance.userId, userId))
        .limit(1);

    if (!balance) return false;

    return (balance.amountTotal - balance.amountUsed) >= amount;
}

export async function deductCredits(
    userId: string,
    amount: number = 1,
    description: string = "Credit Usage",
    videoId?: string,
    seriesId?: string,
    comment?: string
) {
    const [balance] = await db.select()
        .from(creditBalance)
        .where(eq(creditBalance.userId, userId))
        .limit(1);

    if (!balance) {
        throw new Error("User has no credit balance record");
    }

    const available = balance.amountTotal - balance.amountUsed;
    if (available < amount) {
        throw new AppError("InsuffCredits", "Insufficient credits to generate this video", 402);
    }

    await db.transaction(async (tx) => {
        // 1. Update balance
        await tx.update(creditBalance)
            .set({
                amountUsed: balance.amountUsed + amount,
                updatedAt: new Date()
            })
            .where(eq(creditBalance.id, balance.id));

        // 2. Log transaction
        await tx.insert(creditTransaction).values({
            id: randomUUID(),
            userId,
            creditBalanceId: balance.id,
            amount: -amount, // Negative for usage
            description,
            videoId: videoId || null,
            seriesId: seriesId || null,
            comment: comment || null
        });
    });

    return true;
}

export async function grantInitialCredits(userId: string, amount: number = 7) {
    // Check if balance already exists
    const [existing] = await db.select()
        .from(creditBalance)
        .where(eq(creditBalance.userId, userId))
        .limit(1);

    if (existing) {
        console.warn(`[CreditService] User ${userId} already has a credit balance record. Skipping initial grant.`);
        return existing;
    }

    const balanceId = randomUUID();

    return await db.transaction(async (tx) => {
        // 1. Create balance
        const [balance] = await tx.insert(creditBalance).values({
            id: balanceId,
            userId,
            amountTotal: amount,
            amountUsed: 0,
            updatedAt: new Date(),
            createdAt: new Date()
        }).returning();

        // 2. Log transaction
        await tx.insert(creditTransaction).values({
            id: randomUUID(),
            userId,
            creditBalanceId: balance.id,
            amount: amount, // Positive for grant
            description: "Initial Free Credits",
            comment: "Welcome bonus"
        });

        return balance;
    });
}
