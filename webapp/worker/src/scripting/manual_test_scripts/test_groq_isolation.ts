
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Initialize the Groq client
const apiKey = process.env.GROQ_TTS_KEY || process.env.GROQ_API_KEY;

if (!apiKey) {
    console.error("Error: GROQ_TTS_KEY or GROQ_API_KEY not found in environment variables.");
    process.exit(1);
}

const groq = new Groq({ apiKey });

async function main() {
    const audioPath = path.resolve(__dirname, '../../audio.wav');

    if (!fs.existsSync(audioPath)) {
        console.error(`Error: Audio file not found at ${audioPath}`);
        // Create a dummy file for testing if it doesn't exist? No, better to fail or let the user know.
        // Actually, for the purpose of this script, we expect it to exist as per previous checks.
        process.exit(1);
    }

    console.log(`Transcribing file: ${audioPath}`);

    try {
        // Create a transcription job
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-large-v3-turbo",
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
            language: "en",
        });

        console.log("Transcription successful!");
        console.log(JSON.stringify(transcription, null, 2));

        // Validation against expected schema structure
        if ('words' in transcription && Array.isArray(transcription.words)) {
            console.log(`\nExtracted ${transcription.words.length} words.`);
            const mappedSubtitles = transcription.words.map((w: any) => ({
                text: w.word,
                start: w.start * 30, // Convert seconds to frames (assuming 30fps)
                end: w.end * 30
            }));
            console.log("\nMapped Subtitles (First 5):");
            console.log(JSON.stringify(mappedSubtitles.slice(0, 5), null, 2));
        } else {
            console.warn("Warning: 'words' array not found in response.");
        }

    } catch (error) {
        console.error("Error during transcription:", error);
    }
}

main();
