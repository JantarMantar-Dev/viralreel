
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CustomGeminiTTS } from '../../../worker/src/scripting/custom_tts_model.js';
import { addWavHeader } from '../../../worker/src/scripting/utils.js';

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
        const filename = `gemini_${voice.toLowerCase()}.wav`;
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
                                voiceName: voice.toLowerCase()
                            }
                        }
                    }
                }
            };

            const generator = tts.generateContentAsync(request as any);
            let audioData: Buffer | null = null;

            for await (const response of generator) {
                if (response.content?.parts?.[0]?.inlineData?.data) {
                    const data = response.content.parts[0].inlineData.data;
                    if (typeof data === 'string') {
                        audioData = Buffer.from(data, 'base64');
                    } else {
                        audioData = Buffer.from(data as string, 'base64');
                    }
                }
            }

            if (audioData) {
                // Add WAV Header
                const wavData = addWavHeader(audioData, 24000, 1, 16);
                fs.writeFileSync(filePath, wavData);
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
