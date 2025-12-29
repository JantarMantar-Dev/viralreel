
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { CustomGeminiTTS } from '../../../worker/src/scripting/custom_tts_model.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function checkVoices() {
    console.log("Checking available voices...");
    const tts = new CustomGeminiTTS({
        model: 'gemini-2.5-flash-preview-tts',
        apiKey: process.env.GOOGLE_API_KEY
    });

    try {
        const request = {
            contents: [{ parts: [{ text: "Test" }] }],
            config: {
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "INVALID_VOICE_NAME_TO_TRIGGER_LIST"
                        }
                    }
                }
            }
        };

        const generator = tts.generateContentAsync(request);
        for await (const response of generator) {
            // Should not reach here
        }
    } catch (error: any) {
        console.log("Caught expected error. Checking message for voice list...");
        console.log(error.message);
    }
}

checkVoices().catch(console.error);
