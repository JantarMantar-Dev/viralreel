import { IImageModelProvider, ImageProviderConfig } from './types.js';
import { GoogleImageProvider } from './google.provider.js';
import { KieImageProvider } from './kie.provider.js';

export type ImageProviderType = 'google' | 'kie';

export class ImageProviderFactory {
    private static instance: IImageModelProvider | null = null;

    static getProvider(config?: Partial<ImageProviderConfig> & { provider?: ImageProviderType }): IImageModelProvider {
        // If config is provided, we return a new instance specific to that config (useful for testing or overrides)
        if (config) {
            return this.createProvider(config);
        }

        // If no config provided, return the singleton instance (creating it if needed)
        if (!this.instance) {
            this.instance = this.createProvider();
        }

        return this.instance;
    }

    private static createProvider(config?: Partial<ImageProviderConfig> & { provider?: ImageProviderType }): IImageModelProvider {
        const providerType = config?.provider || process.env.IMAGE_MODEL_PROVIDER || 'google';
        
        // Common config
        const apiKey = config?.apiKey || (providerType === 'google' ? process.env.GOOGLE_API_KEY : process.env.KIE_API_KEY) || '';
        const modelName = config?.modelName || (providerType === 'google' ? process.env.GOOGLE_IMAGE_MODEL : process.env.KIE_IMAGE_MODEL);

        const providerConfig: ImageProviderConfig = {
            apiKey,
            modelName
        };

        switch (providerType.toLowerCase()) {
            case 'google':
                return new GoogleImageProvider(providerConfig);
            case 'kie':
                return new KieImageProvider(providerConfig);
            default:
                console.warn(`Unknown provider '${providerType}', falling back to Google`);
                return new GoogleImageProvider(providerConfig);
        }
    }
}
