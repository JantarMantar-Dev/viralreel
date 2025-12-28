import { alignSegmentsWithSubtitles } from '../alignment.js';
import { ScriptSegment, SubtitleWord } from '../types.js';

const mockSegments: ScriptSegment[] = [
    {
        dialogue: "Hello world. This is a test.",
        visualPrompt: "None",
        duration: 5.0 // Estimated
    },
    {
        dialogue: "We are verifying the alignment logic.",
        visualPrompt: "None",
        duration: 4.0 // Estimated
    }
];

const mockSubtitles: SubtitleWord[] = [
    // "Hello world. This is a test."
    // Let's say it takes 2 seconds (60 frames)
    { text: "Hello", start: 0, end: 10 },
    { text: "world", start: 10, end: 20 },
    { text: "This", start: 20, end: 30 },
    { text: "is", start: 30, end: 40 },
    { text: "a", start: 40, end: 50 },
    { text: "test", start: 50, end: 60 },

    // "We are verifying the alignment logic."
    // Let's say it starts at 60 and ends at 150 (3 seconds / 90 frames)
    { text: "We", start: 60, end: 70 },
    { text: "are", start: 70, end: 80 },
    { text: "verifying", start: 80, end: 100 },
    { text: "the", start: 100, end: 110 },
    { text: "alignment", start: 110, end: 130 },
    { text: "logic", start: 130, end: 150 }
];

async function runTest() {
    console.log("Running Alignment Test...");

    const aligned = alignSegmentsWithSubtitles(mockSegments, mockSubtitles);

    // Check first segment
    const seg1 = aligned[0];
    console.log("Segment 1:", seg1);
    if (seg1.oldDuration !== 5.0) console.error("FAIL: Old duration not preserved for seg 1");
    // Expected duration: (60 - 0) / 30 = 2.0s
    if (seg1.duration !== 2.0) console.error(`FAIL: Duration mismatch for seg 1. Expected 2.0, got ${seg1.duration}`);
    else console.log("PASS: Segment 1 duration aligned.");

    // Check second segment (Last segment should have +1s padding)
    const seg2 = aligned[1];
    console.log("Segment 2:", seg2);
    if (seg2.oldDuration !== 4.0) console.error("FAIL: Old duration not preserved for seg 2");

    // Original calculation: (150 - 60) / 30 = 3.0s
    // With 1s padding: 3.0 + 1.0 = 4.0s
    if (seg2.duration !== 4.0) console.error(`FAIL: Duration mismatch for seg 2. Expected 4.0, got ${seg2.duration}`);
    else console.log("PASS: Segment 2 duration aligned and padded.");
}

runTest();
