import { Gemini, LlmRequest, LlmResponse } from '@google/adk';

/**
 * Custom Gemini Model wrapper for TTS to bypass ADK/SDK issues with specific preview models.
 * Uses direct REST API calls for robust audio generation.
 */
export class CustomGeminiTTS extends Gemini {
    static readonly supportedModels = [
        'gemini-2.0-flash-exp',
        'gemini-2.5-pro-preview-tts',
        'gemini-2.5-flash-preview-tts',
        /gemini-.*-tts/
    ];

    constructor(config: { model: string; apiKey?: string }) {
        super({
            model: config.model,
            apiKey: config.apiKey || process.env.GOOGLE_API_KEY || ''
        });
    }

    async *generateContentAsync(
        request: LlmRequest,
        options?: any
    ): AsyncGenerator<LlmResponse, void, unknown> {

        let textParts = request.contents.flatMap(c => c.parts?.filter(p => p.text).map(p => p.text) || []).join(" ");

        // Try to parse as JSON if it looks like a script script output
        try {
            if (textParts.trim().startsWith('{')) {
                const parsed = JSON.parse(textParts);
                if (parsed.segments && Array.isArray(parsed.segments)) {
                    textParts = parsed.segments.map((s: any) => s.dialogue).join(" ");
                    console.log(`[CustomGeminiTTS] Extracted dialogue from ${parsed.segments.length} segments`);
                }
            }
        } catch (e) {
            // Not JSON or failed to parse, use raw text
        }

        const modelName = this.model || (this as any).name || 'gemini-2.0-flash-exp';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${(this as any).apiKey}`;

        console.log(`[CustomGeminiTTS] Calling Gemini API for model: ${modelName}`);

        let voiceName = 'Zephyr';
        const config = request.config as any;
        if (config?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName) {
            voiceName = config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName;
        }

        const payload = {
            contents: [{
                parts: [{ text: textParts }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceName
                        }
                    }
                }
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();

        // Map raw API response to ModelResponse
        const modelResponse: LlmResponse = {
            content: {
                role: 'model',
                parts: []
            }
        };

        if (data.candidates && data.candidates[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
                if (part.inlineData) {
                    modelResponse.content?.parts?.push({
                        inlineData: {
                            mimeType: part.inlineData.mimeType || 'audio/mp3',
                            data: part.inlineData.data
                        }
                    });
                }
            }
        }

        yield modelResponse;
    }
}
