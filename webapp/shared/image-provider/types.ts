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

export const ASPECT_RATIOS: Record<string, string> = {
    "portrait": "9:16",
    "landscape": "16:9",
    "square": "1:1"
};
