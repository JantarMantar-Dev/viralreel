
import { db } from "../db/index.js";
import { creditBalance, creditTransaction } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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

    // Note: We don't strictly check for enough credits here because 
    // we already checked it before queueing. However, we should still handle it.
    const available = balance.amountTotal - balance.amountUsed;
    if (available < amount) {
        // Log it but maybe we shouldn't fail if they already started? 
        // Actually, better to just proceed or handle it gracefully.
        console.warn(`[CreditService] User ${userId} has insufficient credits (${available}/${amount}) but job completed. Proceeding with deduction.`);
    }

    await db.transaction(async (tx) => {
        // 1. Update balance
        await tx.update(creditBalance)
            .set({
                amountUsed: balance.amountUsed + amount,
                updatedAt: new Date()
            })
            .where(eq(creditBalance.id, balance.id));

        // 2. Log transaction (Credit History)
        await tx.insert(creditTransaction).values({
            id: randomUUID(),
            userId,
            creditBalanceId: balance.id,
            amount: -amount, // Negative for usage
            description,
            videoId: videoId || null,
            seriesId: seriesId || null,
            comment: comment || null,
            createdAt: new Date()
        });
    });

    return true;
}
