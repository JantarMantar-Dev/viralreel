import { IImageModelProvider, ImageGenerationOptions, ImageProviderConfig, IMAGE_STYLES, ASPECT_RATIOS } from './types.js';
import { applyStyle } from './style-presets.js';

export class GoogleImageProvider implements IImageModelProvider {
    public providerName = 'google';
    private apiKey: string;
    private modelName: string;
    private isDev: boolean;

    constructor(config: ImageProviderConfig) {
        this.apiKey = config.apiKey;
        this.modelName = config.modelName || 'gemini-3-pro-image-preview';
        this.isDev = process.env.NODE_ENV === 'development';
    }

    async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
        const { prompt, aspectRatio = "portrait", style } = options;

        if (!this.apiKey) {
            throw new Error("Google API Key not configured");
        }

        const mappedAR = ASPECT_RATIOS[aspectRatio.toLowerCase()] || aspectRatio;

        // Append style if provided
        let styledPrompt = prompt;
        if (style) {
            const normalizedStyle = style.toLowerCase().replace(/-/g, ' ');
            
            // Try new preset system first
            const presetPrompt = applyStyle(prompt, normalizedStyle);
            
            if (presetPrompt !== prompt) {
                styledPrompt = presetPrompt;
            } else if (IMAGE_STYLES[normalizedStyle]) {
                styledPrompt = `${prompt} Style: ${IMAGE_STYLES[normalizedStyle]}.`;
            }
        }

        // Append aspect ratio to prompt as per Google's recommendation/implementation
        const augmentedPrompt = `${styledPrompt} --aspect_ratio ${mappedAR}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

        if (this.isDev) {
            console.log(`[GoogleImageProvider] Generating image with AR: ${mappedAR}`);
            console.log(`[GoogleImageProvider] Prompt:\n${augmentedPrompt}`);
        } else {
            console.log(`[GoogleImageProvider] Generating image: "${augmentedPrompt.substring(0, 50)}..." with AR: ${mappedAR}`);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: augmentedPrompt }] }],
                generationConfig: {
                    candidateCount: 1,
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[GoogleImageProvider] API Error:`, errText);
            throw new Error(`Google Image Generation failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        // Find image data in response
        const parts = data.candidates?.[0]?.content?.parts;
        // Check for inlineData or inline_data
        const imagePart = parts?.find((p: any) => p.inlineData || p.inline_data);

        if (!imagePart) {
            // Check if model returned text instead
            const textPart = parts?.find((p: any) => p.text);
            if (textPart) {
                console.error(`[GoogleImageProvider] Model returned text instead of image:`, textPart.text.substring(0, 100));
            }
            throw new Error("No image data in Google API response");
        }

        const imageBase64 = (imagePart.inlineData || imagePart.inline_data).data;
        return Buffer.from(imageBase64, 'base64');
    }
}
