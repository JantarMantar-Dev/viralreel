/**
 * Common utility for submitting data to OpnForm
 */

interface OpnFormSubmission {
    slug: string;
    data: Record<string, any>;
    completionTime?: number;
}

export async function submitOpnForm({ slug, data, completionTime = 10 }: OpnFormSubmission) {
    const response = await fetch(`https://api.opnform.com/forms/${slug}/answer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            completion_time: completionTime,
            ...data,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to submit to OpnForm: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Field IDs for the Contact Sales Form
 * Slug: contact-sales-viral-reel-uscna4
 */
export const CONTACT_SALES_FORM = {
    SLUG: "contact-sales-viral-reel-uscna4",
    FIELDS: {
        FULL_NAME: "82b7f193-edd2-4e24-88df-5961a0589075",
        COMPANY_NAME: "b6744ab1-aee6-4aee-8ec7-26c12af0b507",
        APP_NAME: "52a49bb3-3d01-4e6e-81c4-e83c9cc1d876",
        APP_USER_ID: "72ceed4b-1ecc-4160-9bd1-3eff5622a2b9",
        WORK_EMAIL: "49cb1254-7882-4968-b058-d6e1a461d81a",
        MESSAGE: "d1c8fc41-6056-4553-acf8-0e1c00c19a1a",
    },
    APP_NAME_VALUE: "Viral Reel",
};

/**
 * Field IDs for the Feedback Form
 * Slug: feedback-form-fqbk9l
 */
export const FEEDBACK_FORM = {
    SLUG: "feedback-form-fqbk9l",
    FIELDS: {
        TYPE: "d7ae2c37-bfaa-4f1e-b64f-6feaae972153",
        RATING: "8e2dc3df-530a-475a-afcc-3d6edb1486a1",
        NAME: "e64d0e7f-5498-45bf-9996-182f1c618049",
        EMAIL: "19991dae-bc26-42de-8322-1a9b0130e66b",
        DETAILS: "1e442bb6-77f9-40a5-aab8-8399471f57c6",
        ATTACHMENTS: "5c5196ad-54f9-4593-80f4-75afe3b16b83",
        APP_NAME: "ba12e91c-3667-4023-bba6-68e75164f9e0",
        APP_USER_ID: "211e5628-c0f6-4d68-ac16-2f1ec06e3764",
    },
};
