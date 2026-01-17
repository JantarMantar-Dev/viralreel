import { IImageModelProvider, ImageGenerationOptions, ImageProviderConfig, ASPECT_RATIOS } from './types.js';

interface KieCreateTaskResponse {
    code: number;
    message: string;
    data: {
        taskId: string;
    };
}

interface KieTaskResultResponse {
    code: number;
    message: string;
    data: {
        taskId: string;
        state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
        resultJson: string | null; // JSON string containing resultUrls
        failMsg: string | null;
    };
}

interface KieResultJson {
    resultUrls: string[];
}

export class KieImageProvider implements IImageModelProvider {
    public providerName = 'kie';
    private apiKey: string;
    private modelName: string;
    private baseUrl = 'https://api.kie.ai/api/v1';
    private isDev: boolean;

    constructor(config: ImageProviderConfig) {
        this.apiKey = config.apiKey;
        this.modelName = config.modelName || 'z-image';
        this.isDev = process.env.NODE_ENV === 'development';
    }

    private getAspectRatio(aspectRatio?: string): string {
        if (!aspectRatio) return "1:1";
        const ratio = ASPECT_RATIOS[aspectRatio];
        return ratio || "1:1";
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async createTask(prompt: string, aspectRatio: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/jobs/createTask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.modelName,
                input: {
                    prompt,
                    aspect_ratio: aspectRatio
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create KIE task: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json() as KieCreateTaskResponse;
        
        if (result.code !== 200) {
            throw new Error(`KIE API error: ${result.message}`);
        }

        return result.data.taskId;
    }

    private async pollTask(taskId: string): Promise<string[]> {
        const maxAttempts = 60; // 2 minutes with 2s interval
        const interval = 2000;

        for (let i = 0; i < maxAttempts; i++) {
            const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                // If network error, maybe retry? For now, throw.
                throw new Error(`Failed to query KIE task status: ${response.status}`);
            }

            const result = await response.json() as KieTaskResultResponse;

            if (result.code !== 200) {
                 throw new Error(`KIE API error polling task: ${result.message}`);
            }

            const { state, resultJson, failMsg } = result.data;

            if (state === 'success') {
                if (!resultJson) {
                    throw new Error("KIE task success but no resultJson");
                }
                try {
                    const parsedResult = JSON.parse(resultJson) as KieResultJson;
                    return parsedResult.resultUrls;
                } catch (e) {
                    throw new Error("Failed to parse KIE resultJson");
                }
            } else if (state === 'fail') {
                throw new Error(`KIE task failed: ${failMsg || 'Unknown error'}`);
            }

            // Waiting, queuing, generating... wait and retry
            await this.sleep(interval);
        }

        throw new Error("KIE task generation timed out");
    }

    async generateImage(options: ImageGenerationOptions): Promise<Buffer> {
        const { prompt, aspectRatio } = options;

        if (!this.apiKey) {
            throw new Error("KIE API Key not configured");
        }

        if (this.isDev) {
            console.log(`[KieImageProvider] Generating image for prompt:\n${prompt}`);
        } else {
            console.log(`[KieImageProvider] Generating image for prompt: "${prompt.substring(0, 50)}..."`);
        }
        
        try {
            const ratio = this.getAspectRatio(aspectRatio);
            const taskId = await this.createTask(prompt, ratio);
            
            console.log(`[KieImageProvider] Task created: ${taskId}, waiting for completion...`);
            
            const urls = await this.pollTask(taskId);
            
            if (urls.length === 0) {
                throw new Error("KIE returned no image URLs");
            }

            const imageUrl = urls[0];
            console.log(`[KieImageProvider] Image generated: ${imageUrl}`);

            // Download the image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to download generated image: ${imageResponse.statusText}`);
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            return Buffer.from(arrayBuffer);

        } catch (error) {
            console.error("[KieImageProvider] Error generating image:", error);
            throw error;
        }
    }
}
