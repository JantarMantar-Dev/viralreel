import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            const { sendResetPasswordEmail } = await import("./email.js");
            await sendResetPasswordEmail(user.email, url, user.name);
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const { sendVerifyEmail } = await import("./email.js");
            await sendVerifyEmail(user.email, url, user.name);
        },
    },
    plugins: [
        {
            id: "password-change-notifier",
            hooks: {
                after: [
                    {
                        matcher: (context) => context.path?.includes("/change-password") && context.method === "POST",
                        handler: async (ctx: any) => {
                            const user = ctx.context?.user || ctx.user || ctx.context?.session?.user || ctx.context?.newSession?.user;

                            if (user && user.email) {
                                const { sendPasswordChangedEmail } = await import("./email.js");
                                await sendPasswordChangedEmail(user.email, user.name);
                            }
                            return ctx;
                        }
                    }
                ]
            }
        }
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
