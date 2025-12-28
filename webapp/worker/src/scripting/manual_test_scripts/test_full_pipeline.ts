
import { runContentPipeline } from '../agents.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function main() {
    const videoId = `test_pipeline_${Date.now()}`;
    const prompt = "A super short story (20 words) about a robot who loves to paint.";
    console.log("Running pipeline for videoId:", videoId);
    try {
        // Using a short prompt to speed up test
        const result = await runContentPipeline(videoId, prompt);
        console.log("Pipeline completed successfully!");

        // Validation
        if (!result.script.segments || result.script.segments.length === 0) {
            console.error("FAIL: No segments generated.");
        } else {
            console.log(`PASS: Generated ${result.script.segments.length} segments.`);
        }

        if (!result.script.subtitles || result.script.subtitles.length === 0) {
            console.error("FAIL: No subtitles generated.");
        } else {
            console.log(`PASS: Generated ${result.script.subtitles?.length} subtitles.`);
        }

        // Check alignment duration
        const firstSeg = result.script.segments[0];
        if (firstSeg.duration <= 0) {
            console.warn("WARN: First segment duration is 0 or negative.");
        } else {
            console.log(`PASS: First segment duration: ${firstSeg.duration}s`);
        }

    } catch (e) {
        console.error("Pipeline failed:", e);
    }
}
main();
