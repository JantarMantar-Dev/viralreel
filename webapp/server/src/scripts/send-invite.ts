import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// -- Resolve .env.support path relative to this script --
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env.support");

console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("❌ Failed to load .env.support file:", result.error);
    process.exit(1);
} else {
    console.log("✅ .env.support file loaded successfully.");
}

// Import email service AFTER loading env vars
// Dynamic import is needed to ensure env vars are loaded first if the module keeps top-level side effects (though here it's fine as we load dotenv first)
// But since we are using TS execution, we can just import normally if we were careful, but let's stick to dynamic to be safe and consistent with test-emails.ts pattern
const { sendWaitlistInviteEmail } = await import("../lib/email.js");

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address as an argument.");
    console.error("Usage: npx tsx webapp/server/src/scripts/send-invite.ts <email>");
    process.exit(1);
}

async function main() {
    console.log(`Sending waitlist invite to ${email}...`);
    const res = await sendWaitlistInviteEmail(email);

    if (res.success) {
        console.log("✅ Email sent successfully!");
    } else {
        console.error("❌ Failed to send email:", res.error);
    }
}

main();
