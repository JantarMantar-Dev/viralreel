/**
 * Common utility for submitting data to OpnForm
 */

interface OpnFormSubmission {
    slug: string;
    data: Record<string, any>;
    completionTime?: number;
}

export async function submitOpnForm({ slug, data, completionTime = 10 }: OpnFormSubmission) {
    try {
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
            const errorMessage = errorData.message || `Failed to submit to OpnForm: ${response.statusText}`;
            console.error(errorMessage);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error submitting to OpnForm:", error);
        return null;
    }
}

/**
 * Field IDs for the User List Form
 * Slug: user-list-form-3zeadn
 */
export const USER_LIST_FORM = {
    SLUG: "user-list-form-3zeadn",
    FIELDS: {
        USER_NAME: "2d383a6a-1dc1-414b-a736-d84d0704d370",
        EMAIL: "c02befcc-369c-4677-85da-5949d1354bff",
        APP_NAME: "cc4041e5-001c-45cb-a2a3-f1e9de5b383a",
    },
    APP_NAME_VALUE: "Viral Reel",
};
