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
