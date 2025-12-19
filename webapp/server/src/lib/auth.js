const { betterAuth } = require("better-auth");
const Database = require("better-sqlite3");

const auth = betterAuth({
    database: new Database("auth.db"),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: ["http://localhost:5173"],
});

module.exports = { auth };
