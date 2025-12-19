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
