import { IMAGE_STYLE_PRESETS as PRESET_STYLES } from './style-presets.js';

export interface ImageGenerationOptions {
    prompt: string;
    aspectRatio?: string;
    style?: string;
    width?: number;
    height?: number;
    negativePrompt?: string;
}

export interface ImageProviderConfig {
    apiKey: string;
    modelName?: string;
}

export interface IImageModelProvider {
    generateImage(options: ImageGenerationOptions): Promise<Buffer>;
    providerName: string;
}

// Map the new structured styles to a simple Record<string, string> for backward compatibility
// where value is the description.
export const IMAGE_STYLES: Record<string, string> = Object.entries(PRESET_STYLES).reduce((acc, [key, value]) => {
    acc[key] = value.description;
    return acc;
}, {} as Record<string, string>);

export const ASPECT_RATIOS: Record<string, string> = {
    "portrait": "9:16",
    "landscape": "16:9",
    "square": "1:1"
};

