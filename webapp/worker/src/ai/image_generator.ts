import * as fs from 'fs/promises';
import * as path from 'path';
import { ImageProviderFactory, IMAGE_STYLES as SHARED_STYLES } from '../../../shared/image-provider/index.js';

// Visual Style Definitions
export const IMAGE_STYLES = SHARED_STYLES;

export class ImageGenerator {
    constructor() {
        // Provider initialization is handled by the factory on demand or can be cached here
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
            const provider = ImageProviderFactory.getProvider();
            
            const imageBuffer = await provider.generateImage({
                prompt,
                aspectRatio,
                style
            });

            // Ensure directory exists
            const dir = path.dirname(outputPath);
            await fs.mkdir(dir, { recursive: true });

            await fs.writeFile(outputPath, imageBuffer);

            console.log(`[ImageGenerator] Image saved to: ${outputPath}`);

        } catch (error) {
            console.error(`[ImageGenerator] Failed to generate image:`, error);
            throw error;
        }
    }
}
