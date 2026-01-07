import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// -- Resolve .env path relative to this script --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("❌ Failed to load .env file:", result.error);
} else {
    console.log("✅ .env file loaded successfully.");
    console.log("Loaded keys:", Object.keys(result.parsed || {}));
}

console.log("SMTP Configuration Check:");
console.log(`- Host: ${process.env.SMTP_OUT_SERVER || "(undefined)"}`);
console.log(`- Port: ${process.env.SMTP_PORT || "(undefined)"}`);
console.log(`- User: ${process.env.SMTP_EMAIL_USER ? "(Present)" : "(Missing)"}`);

const TEST_EMAIL = "test@getviralreel.com";
const USER_NAME = "Alex";

async function main() {
    console.log(`Starting email tests using recipient: ${TEST_EMAIL}...\n`);

    // Import email service AFTER loading env vars so the transporter is initialized with correct credentials
    const {
        sendWelcomeEmail,
        sendVerifyEmail,
        sendPasswordChangedEmail,
        sendResetPasswordEmail,
        sendSubscriptionEmail,
        sendVideoReadyEmail,
        sendSubscriptionCancelledEmail,
    } = await import("../lib/email.js");

    const runTest = async (name: string, fn: () => Promise<any>) => {
        console.log(`Sending ${name}...`);
        const result = await fn();
        if (result.success) {
            console.log(`✅ ${name} sent.\n`);
        } else {
            console.error(`❌ Failed to send ${name}:`, result.error, "\n");
        }
    };

    try {
        await runTest("Welcome Email", () => sendWelcomeEmail(TEST_EMAIL, USER_NAME));

        await runTest("Verify Email", () =>
            sendVerifyEmail(TEST_EMAIL, "https://getviralreel.com/verify?token=mock-token", USER_NAME)
        );

        await runTest("Reset Password Email", () =>
            sendResetPasswordEmail(TEST_EMAIL, "https://getviralreel.com/reset-password?token=mock-token", USER_NAME)
        );

        await runTest("Password Changed Email", () =>
            sendPasswordChangedEmail(TEST_EMAIL, USER_NAME)
        );

        await runTest("Subscription Confirmed Email", () =>
            sendSubscriptionEmail(
                TEST_EMAIL,
                USER_NAME,
                "Creator Plus",
                "$29.00 / month",
                "November 24, 2024"
            )
        );

        await runTest("Video Ready Email", () =>
            sendVideoReadyEmail(
                TEST_EMAIL,
                USER_NAME,
                "Future of Tech - Episode 1",
                "https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=600&auto=format&fit=crop",
                "https://app.hboard/videos/123",
                "02:14"
            )
        );

        await runTest("Subscription Cancelled Email", () =>
            sendSubscriptionCancelledEmail(
                TEST_EMAIL,
                USER_NAME,
                "Creator Plus",
                "November 24, 2024",
                "December 24, 2024"
            )
        );

        console.log("� Email test run completed.");
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        process.exit(1);
    }
}

main();
