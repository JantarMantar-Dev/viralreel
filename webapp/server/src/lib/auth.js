const { betterAuth } = require("better-auth");
const Database = require("better-sqlite3");

const auth = betterAuth({
    database: new Database(process.env.DATABASE_URL || "auth.db"),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [process.env.CLIENT_URL],
});

module.exports = { auth };
