import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const { sendVerifyEmail } = await import("./email.js");
            await sendVerifyEmail(user.email, url);
        },
    },
    plugins: [
        // Add any other plugins here 
    ],
    socialProviders: {
        google: {
            prompt: "select_account consent",
            accessType: "offline",
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    trustedOrigins: [
        ...(process.env.TRUSTED_ORIGINS || "").split(",").map((o) => o.trim()),
        process.env.CLIENT_URL || "",
        "http://localhost:3000"
    ],
});
