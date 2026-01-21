import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    try {
                        const { grantInitialCredits } = await import("../services/credit-service.js");
                        await grantInitialCredits(user.id, 7);
                    } catch (error) {
                        console.error(`[AuthHook] Failed to grant initial credits to user ${user.id}:`, error);
                    }

                    try {
                        const { submitOpnForm, USER_LIST_FORM } = await import("./opnform.js");
                        await submitOpnForm({
                            slug: USER_LIST_FORM.SLUG,
                            data: {
                                [USER_LIST_FORM.FIELDS.USER_NAME]: user.name,
                                [USER_LIST_FORM.FIELDS.EMAIL]: user.email,
                                [USER_LIST_FORM.FIELDS.APP_NAME]: USER_LIST_FORM.APP_NAME_VALUE,
                            },
                        });
                    } catch (error) {
                        console.error(`[AuthHook] Failed to submit user ${user.id} to OpnForm:`, error);
                    }
                }
            }
        }
    },
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
            const { sendVerifyEmail, sendWelcomeEmail } = await import("./email.js");
            // Send both verification and welcome emails
            await Promise.all([
                sendVerifyEmail(user.email, url, user.name),
                sendWelcomeEmail(user.email, user.name || "there")
            ]);
        },
    },
    plugins: [
        {
            id: "password-change-notifier",
            hooks: {
                after: [
                    {
                        matcher: (context) => (context.path?.includes("/change-password") ?? false) && context.method === "POST",
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
