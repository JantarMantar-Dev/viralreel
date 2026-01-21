import { submitOpnForm, USER_LIST_FORM } from "../lib/opnform.js";

async function main() {
    console.log("Testing OpnForm submission...");

    const testUser = {
        name: "Test User",
        email: "test.user@example.com",
    };

    console.log("Submitting for user:", testUser);

    const result = await submitOpnForm({
        slug: USER_LIST_FORM.SLUG,
        data: {
            [USER_LIST_FORM.FIELDS.USER_NAME]: testUser.name,
            [USER_LIST_FORM.FIELDS.EMAIL]: testUser.email,
            [USER_LIST_FORM.FIELDS.APP_NAME]: USER_LIST_FORM.APP_NAME_VALUE,
        },
    });

    if (result) {
        console.log("Submission successful!");
        console.log("Result:", JSON.stringify(result, null, 2));
    } else {
        console.error("Submission failed.");
    }
}

main().catch(console.error);
