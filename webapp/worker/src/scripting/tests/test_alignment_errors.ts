import { alignSegmentsWithSubtitles } from '../alignment.js';
import { ScriptSegment, SubtitleWord } from '../types.js';

// Helper to create subtitles from text with simplified timing
function createSubtitlesFromText(text: string, startSec: number = 0): SubtitleWord[] {
    const words = text.split(" ");
    let currentFrame = startSec * 30;
    return words.map(word => {
        const start = currentFrame;
        const end = currentFrame + 10; // 10 frames per word approx
        currentFrame = end + 2; // small gap
        return { text: word, start, end };
    });
}

const originalDialogue1 = "The quick brown fox jumps over the lazy dog";
const originalDialogue2 = "Sphinx of black quartz judge my vow";

const segments: ScriptSegment[] = [
    { dialogue: originalDialogue1, duration: 5, visualPrompt: "" },
    { dialogue: originalDialogue2, duration: 5, visualPrompt: "" }
];

async function runTests() {
    console.log("=== Robustness Tests (Hard Mode) ===");

    // Test 1: Typos (10% error rate approx) with Start Word Typo
    // "Te quick brown fx jumps ovr the lazy dg"
    console.log("\n--- Test 1: Typos with Start Word Error ---");
    const typoText1 = "Te quick brown fx jumps ovr the lazy dg";
    const typoText2 = "Sphinxs of black qartz judge my vow"; // extra s, missing u

    // Create subtitles FROM the typo text
    const subs1 = createSubtitlesFromText(typoText1, 0);
    const subs2 = createSubtitlesFromText(typoText2, 4); // start later
    const allSubsTypos = [...subs1, ...subs2];

    const alignedTypos = alignSegmentsWithSubtitles(JSON.parse(JSON.stringify(segments)), allSubsTypos);
    console.log(`Segment 1 Duration (Typos): ${alignedTypos[0].duration}`);
    console.log(`Segment 2 Duration (Typos): ${alignedTypos[1].duration}`);

    // Expect Segment 2 to fail alignment if we don't handle "Sphinxs" vs "Sphinx"
    // Segment 2 should be around 2.8s - 3.0s
    if (alignedTypos[1].duration > 2 && alignedTypos[1].duration < 4) console.log("PASS: Handled start-word typo (Seg 2)");
    else console.log(`FAIL: Seg 2 alignment failed (Duration: ${alignedTypos[1].duration})`);


    // Test 2: Missing Start Word
    // "quick brown fox jumps over the lazy dog" (Missing "The")
    console.log("\n--- Test 2: Missing Start Word ---");
    const missingStartText = "quick brown fox jumps over the lazy dog";
    const subsMissing = createSubtitlesFromText(missingStartText, 0);
    const subsNormal2 = createSubtitlesFromText(originalDialogue2, 4);

    const alignedMissing = alignSegmentsWithSubtitles(JSON.parse(JSON.stringify(segments)), [...subsMissing, ...subsNormal2]);
    console.log(`Segment 1 Duration (Missing Start): ${alignedMissing[0].duration}`);
    if (alignedMissing[0].duration > 1) console.log("PASS: Handled missing start word");
    else console.log(`FAIL: Duration: ${alignedMissing[0].duration}`);


    // Test 3: Homophones
    // "The quick brown fox jumps over their lazy dog" ("the" -> "their")
    console.log("\n--- Test 3: Homophones ---");
    const homophoneText = "The quick brown fox jumps over their lazy dog";
    const subsHomophone = createSubtitlesFromText(homophoneText, 0);
    const alignedHomophone = alignSegmentsWithSubtitles(JSON.parse(JSON.stringify(segments)), [...subsHomophone, ...subsNormal2]);
    console.log(`Segment 1 Duration (Homophone): ${alignedHomophone[0].duration}`);
    if (alignedHomophone[0].duration > 1) console.log("PASS: Handled homophones");
    else console.log("FAIL: Alignment failed");
}

runTests();
