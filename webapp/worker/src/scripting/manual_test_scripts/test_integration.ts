
import { generateSubtitles } from '../agents.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function main() {
    console.log("Starting Integration Test for Direct Groq Generation...");

    // We need to simulate a valid video working directory or point to one.
    // For this test, we can Mock 'resolveWorkDir' or just ensure a directory exists and pass its ID if resolveWorkDir uses a pattern.
    // resolveWorkDir uses VIDEO_WORK_DIR or ./work_dir

    const testVideoId = 'test_integration_groq';
    const workDir = path.resolve(process.cwd(), 'work_dir', testVideoId);

    // Setup: Copy audio.wav to this work dir
    if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
    }

    const sourceAudio = path.resolve(__dirname, '../../audio.wav');
    const targetAudio = path.resolve(workDir, 'audio.wav');

    if (fs.existsSync(sourceAudio)) {
        fs.copyFileSync(sourceAudio, targetAudio);
        console.log(`Copied test audio to ${targetAudio}`);
    } else {
        console.error(`Source audio not found at ${sourceAudio}`);
        process.exit(1);
    }

    try {
        const subtitles = await generateSubtitles(testVideoId);

        if (subtitles && Array.isArray(subtitles)) {
            console.log(`\nSUCCESS: Generated ${subtitles.length} subtitles.`);
            console.log("Sample:", JSON.stringify(subtitles.slice(0, 3), null, 2));
        } else {
            console.error("\nFAILURE: Subtitles returned null or invalid format.");
        }
    } catch (err) {
        console.error("Error during test:", err);
    }
}

main();
