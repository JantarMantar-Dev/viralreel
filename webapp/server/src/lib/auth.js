const { betterAuth } = require("better-auth");
const { drizzleAdapter } = require("better-auth/adapters/drizzle");
const { db } = require("../db");
const schema = require("../db/schema");

console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);

const auth = betterAuth({
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
        sendVerificationEmail: async (user, url, token) => {
            const { sendVerifyEmail } = await import("./email");
            await sendVerifyEmail(user.email, url);
        },
    },
    plugins: [
        // Add any other plugins here 
    ],
    hooks: {
        after: {
            signUp: async (ctx) => {
                // Optional: Send welcome email here? Or after verification?
                // Since verification is enabled, we might want to wait.
                // But for now, let's keep it simple.
            }
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    trustedOrigins: [
        ...(process.env.TRUSTED_ORIGINS || "").split(",").map((o) => o.trim()),
        process.env.CLIENT_URL,
        "http://localhost:3000"
    ],
});

module.exports = { auth };
