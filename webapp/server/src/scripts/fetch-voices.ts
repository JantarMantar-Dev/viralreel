
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CustomGeminiTTS } from '../../../worker/src/scripting/custom_tts_model.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const VOICES = [
    'Achernar', 'Achird', 'Algenib', 'Algieba', 'Alnilam',
    'Aoede', 'Autonoe', 'Callirrhoe', 'Charon', 'Despina',
    'Enceladus', 'Erinome', 'Fenrir', 'Gacrux', 'Iapetus',
    'Kore', 'Laomedeia', 'Leda', 'Orus', 'Puck',
    'Pulcherrima', 'Rasalgethi', 'Sadachbia', 'Sadaltager', 'Schedar',
    'Sulafat', 'Umbriel', 'Vindemiatrix', 'Zephyr', 'Zubenelgenubi'
];
const OUTPUT_DIR = path.resolve(__dirname, '../../../../webapp/client/public/assets/voices');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ~10 seconds of text
const PREVIEW_TEXT = "Welcome to Viral Reel. I am one of the many advanced AI voices available to bring your content to life. Whether you are creating a short clip or a full series, my voice is designed to engage and captivate your audience.";

async function generateVoicePreviews() {
    console.log("Generative Voice Previews...");
    const tts = new CustomGeminiTTS({
        model: 'gemini-2.5-flash-preview-tts',
        apiKey: process.env.GOOGLE_API_KEY
    });

    for (const voice of VOICES) {
        const filename = `gemini_${voice.toLowerCase()}.mp3`;
        const filePath = path.join(OUTPUT_DIR, filename);

        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping existing voice: ${voice}`);
            continue;
        }

        console.log(`Generating preview for voice: ${voice}`);
        try {
            const request = {
                contents: [{ parts: [{ text: PREVIEW_TEXT }] }],
                config: {
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice.toLowerCase() // API usually expects lowercase or exact match, list was mixed case so ensuring lower might be safer or keeping exact from error list
                            }
                        }
                    }
                }
            };

            const generator = tts.generateContentAsync(request as any);
            let audioData: Uint8Array | null = null;

            for await (const response of generator) {
                if (response.content?.parts?.[0]?.inlineData?.data) {
                    // Check if data is string (base64) or Uint8Array. 
                    // The inlineData.data in @google/adk types often comes as base64 string
                    const data = response.content.parts[0].inlineData.data;
                    if (typeof data === 'string') {
                        audioData = Buffer.from(data, 'base64');
                    } else {
                        // assume it's already a buffer or uint8array if not string (though usually base64 in JSON response)
                        // But purely based on CustomGeminiTTS implementation, it returns what the API returns.
                        // Let's look at CustomGeminiTTS again if needed.
                        // It returns parts with inlineData.data
                        // In CustomGeminiTTS:
                        // data: part.inlineData.data 
                        // Check what part.inlineData.data is from the fetch response.
                        // The fetch response is JSON. so data is a base64 string.
                        audioData = Buffer.from(data as string, 'base64');
                    }
                }
            }

            if (audioData) {
                const filename = `gemini_${voice.toLowerCase()}.mp3`;
                const filePath = path.join(OUTPUT_DIR, filename);
                fs.writeFileSync(filePath, audioData);
                console.log(`✅ Saved preview: ${filename}`);
            } else {
                console.error(`❌ Failed to generate audio for ${voice}`);
            }

        } catch (error) {
            console.error(`❌ Error generating ${voice}:`, error);
        }
    }
}

generateVoicePreviews().catch(console.error);
