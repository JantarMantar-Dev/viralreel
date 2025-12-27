
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs/promises';
import * as path from 'path';

// Visual Style Definitions
export const IMAGE_STYLES: Record<string, string> = {
    "comic": "Bold comic-book style, thick outlines",
    "creepy comic": "Horror-comic style, exaggerated shades",
    "painting": "Detailed traditional painting style",
    "ghibli": "Studio Ghibli-inspired, soft colors",
    "anime": "Clean anime style, sharp linework",
    "dark fantasy": "Moody atmosphere, dark colors",
    "lego": "Plastic texture, LEGO figure style",
    "polaroid": "Vintage Polaroid style, soft glow",
    "disney": "Classic animation style, soft curves",
    "realism": "Ultra-realistic photographic style",
    "fantastic": "Vibrant magical fantasy style"
};

export class ImageGenerator {
    private apiKey: string;
    private modelName: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_API_KEY || '';
        if (!this.apiKey) {
            throw new Error("GOOGLE_API_KEY not found in environment variables");
        }

        // Use the requested model
        this.modelName = process.env.GOOGLE_IMAGE_MODEL || 'gemini-3-pro-image-preview';
        console.log(`[ImageGenerator] Using model: ${this.modelName}`);
    }

    /**
     * Generates an image from a text prompt and saves it to the specified path.
     * @param prompt The visual description of the image.
     * @param outputPath The absolute path where the image should be saved.
     * @param aspectRatio The aspect ratio for the image (e.g., "16:9", "9:16").
     * @param style Optional visual style to apply to the image.
     */
    async generateAndSave(prompt: string, outputPath: string, aspectRatio: string = "16:9", style?: string): Promise<void> {
        try {
            // Append style description if provided and valid
            let stylePrompt = "";
            if (style && IMAGE_STYLES[style.toLowerCase()]) {
                stylePrompt = ` Style: ${IMAGE_STYLES[style.toLowerCase()]}.`;
            }

            // Append orientation to prompt as per user request
            const augmentedPrompt = `${prompt}${stylePrompt} --aspect_ratio ${aspectRatio}`;
            console.log(`[ImageGenerator] Generating image for prompt: "${augmentedPrompt.substring(0, 50)}..." with AR: ${aspectRatio}`);

            // Using generateContent endpoint which is standard for Gemini models
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

            const payload = {
                contents: [
                    {
                        parts: [
                            { text: augmentedPrompt }
                        ]
                    }
                ],
                // Note: For image generation via Gemini, parameters might be specific or just via prompt.
                // Use standard generation config.
                generationConfig: {
                    candidateCount: 1,
                    // temperature: 0.4 // optional
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Parse response
            // For standard Gemini text: candidates[0].content.parts[0].text
            // For Image (if supported inline): candidates[0].content.parts[0].inlineData (or inline_data)

            const candidate = data.candidates?.[0];
            if (!candidate) {
                throw new Error("No candidates returned from API");
            }

            const parts = candidate.content?.parts;
            if (!parts || parts.length === 0) {
                throw new Error("No content parts returned");
            }

            // Search for inlineData (image) - check both camelCase and snake_case just in case
            const imagePart = parts.find((p: any) => p.inlineData || p.inline_data);

            if (!imagePart) {
                // Check if it returned text refusing to generate or describing it
                const textPart = parts.find((p: any) => p.text);
                if (textPart) {
                    throw new Error(`Model returned text instead of image: ${textPart.text.substring(0, 100)}...`);
                }
                throw new Error("No image data found in response");
            }

            const imageBase64 = (imagePart.inlineData || imagePart.inline_data).data;
            if (!imageBase64) {
                throw new Error("No image data in prediction");
            }

            // Ensure directory exists
            const dir = path.dirname(outputPath);
            await fs.mkdir(dir, { recursive: true });

            const buffer = Buffer.from(imageBase64, 'base64');
            await fs.writeFile(outputPath, buffer);

            console.log(`[ImageGenerator] Image saved to: ${outputPath}`);

        } catch (error) {
            console.error(`[ImageGenerator] Failed to generate image:`, error);
            throw error;
        }
    }
}
