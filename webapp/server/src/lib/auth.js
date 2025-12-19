const { betterAuth } = require("better-auth");
const { drizzleAdapter } = require("better-auth/adapters/drizzle");
const { db } = require("../db");
const schema = require("../db/schema");

const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    trustedOrigins: [process.env.CLIENT_URL],
});

module.exports = { auth };
