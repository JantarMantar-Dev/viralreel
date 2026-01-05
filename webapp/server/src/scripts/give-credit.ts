import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { user, creditBalance, creditTransaction } from "../db/schema.js";

export async function giveCredit(email: string, amount: number) {
    if (!email) {
        throw new Error("Email is required.");
    }

    if (isNaN(amount)) {
        throw new Error("Invalid amount.");
    }

    console.log(`Giving ${amount} credits to user with email: ${email}`);

    // 1. Check if user exists
    const foundUsers = await db.select().from(user).where(eq(user.email, email)).limit(1);

    if (foundUsers.length === 0) {
        throw new Error(`❌ User with email '${email}' not found.`);
    }

    const targetUser = foundUsers[0];
    console.log(`✅ Found user: ${targetUser.name} (${targetUser.id})`);

    // 2. Check/Upsert Credit Balance
    const foundBalances = await db
        .select()
        .from(creditBalance)
        .where(eq(creditBalance.userId, targetUser.id))
        .limit(1);

    let balanceId: string;

    if (foundBalances.length === 0) {
        console.log("Creating new credit balance record...");
        const newBalanceId = crypto.randomUUID();
        await db.insert(creditBalance).values({
            id: newBalanceId,
            userId: targetUser.id,
            amountTotal: amount,
            amountUsed: 0,
        });
        balanceId = newBalanceId;
        console.log(`✅ Created credit balance. New Total: ${amount}`);
    } else {
        const currentBalance = foundBalances[0];
        console.log(`Updating existing credit balance. Current Total: ${currentBalance.amountTotal}`);

        await db
            .update(creditBalance)
            .set({
                amountTotal: sql`${creditBalance.amountTotal} + ${amount}`,
                updatedAt: new Date(),
            })
            .where(eq(creditBalance.id, currentBalance.id));

        balanceId = currentBalance.id;
        console.log(`✅ Updated credit balance. Added: ${amount}`);
    }

    // 3. Log Transaction
    console.log("Logging transaction...");
    await db.insert(creditTransaction).values({
        id: crypto.randomUUID(),
        userId: targetUser.id,
        creditBalanceId: balanceId,
        amount: amount,
        description: "Admin manual grant (script)",
    });
    console.log("✅ Transaction logged.");
    return true;
}

// Execute if run directly
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import path from "path";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // -- Resolve .env path relative to this script --
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, "../../.env");

    console.log(`Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });

    const args = process.argv.slice(2);
    const email = args[0];
    const amountStr = args[1];

    if (!email) {
        console.error("Usage: npm run give-credit <email> [amount]");
        process.exit(1);
    }

    const amount = amountStr ? parseInt(amountStr, 10) : 10;

    giveCredit(email, amount)
        .then(() => {
            console.log("Done.");
            process.exit(0);
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
