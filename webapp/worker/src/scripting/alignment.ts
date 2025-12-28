import { ScriptSegment, SubtitleWord } from './types.js';

/**
 * Normalizes text for comparison by removing punctuation and converting to lowercase.
 */
function normalizeText(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ");
}

/**
 * Aligns script segments with generated subtitles to fix duration discrepancies.
 * 
 * @param segments The original script segments with estimated durations
 * @param subtitles The generated word-level subtitles with precise timestamps (in frames)
 * @returns The segments with updated durations matching the audio
 */
export function alignSegmentsWithSubtitles(
    segments: ScriptSegment[],
    subtitles: SubtitleWord[]
): ScriptSegment[] {
    if (!subtitles || subtitles.length === 0) {
        return segments;
    }

    const alignedSegments = [...segments];
    let currentSubtitleIndex = 0;

    // Helper to get text from a range of subtitles
    const getSubtitleText = (start: number, end: number) => {
        return subtitles.slice(start, end).map(s => s.text).join(' ');
    };

    for (let i = 0; i < alignedSegments.length; i++) {
        const segment = alignedSegments[i];

        // Preserve old duration
        segment.oldDuration = segment.duration;

        const segmentWords = normalizeText(segment.dialogue);
        if (segmentWords.length === 0) continue;

        let bestMatchStartIndex = currentSubtitleIndex;
        let matchCount = 0;

        // Simple heuristic: 
        // We assume segments are in order.
        // We look for the first word of the segment in the next N subtitles.
        // If found, we assume that's the start.

        // 1. Find Start
        // detailed search is expensive, so we just scan forward until we find a match for the first word
        // or we run out of reasonable search space (e.g. 50 words buffer)

        let foundStart = false;
        let searchLimit = Math.min(subtitles.length, currentSubtitleIndex + 50); // Look ahead limit

        for (let j = currentSubtitleIndex; j < searchLimit; j++) {
            const subWord = normalizeText(subtitles[j].text)[0];
            if (subWord === segmentWords[0]) {
                // Potential match, let's verify a bit more if possible
                // If segment has > 1 word, check 2nd word too
                if (segmentWords.length > 1 && j + 1 < subtitles.length) {
                    const nextSubWord = normalizeText(subtitles[j + 1].text)[0];
                    if (nextSubWord === segmentWords[1]) {
                        bestMatchStartIndex = j;
                        foundStart = true;
                        break;
                    }
                } else {
                    bestMatchStartIndex = j;
                    foundStart = true;
                    break;
                }
            }
        }

        if (!foundStart) {
            // Fallback: If we can't find the start word, we might assume it starts right after the previous one
            // But let's verify if the PREVIOUS segment ended too early?
            // For now, let's stick to "start where previous left off" if not found, 
            // but warned.
            bestMatchStartIndex = currentSubtitleIndex;
        }

        // 2. Find End
        // We want to consume roughly 'segmentWords.length' words.
        // But audio might have skips or extra words.
        // We search for the LAST word of the segment.

        let bestMatchEndIndex = bestMatchStartIndex;
        const lastSegmentWord = segmentWords[segmentWords.length - 1];

        // Start searching for the end word from (start + length - margin)
        let searchEndStart = Math.max(bestMatchStartIndex, bestMatchStartIndex + segmentWords.length - 5);
        let searchEndLimit = Math.min(subtitles.length, bestMatchStartIndex + segmentWords.length + 20); // Allow some extra words

        let foundEnd = false;

        for (let j = searchEndStart; j < searchEndLimit; j++) {
            const subWord = normalizeText(subtitles[j].text)[0];
            if (subWord === lastSegmentWord) {
                bestMatchEndIndex = j;
                foundEnd = true;
                // Don't break immediately, maybe there's a better match further?
                // Actually for "end", the first match after the expected length is usually good?
                // Or the last match within reasonable range?
                // Let's take the first match that satisfies minimal length constraint
            }
        }

        if (!foundEnd) {
            // Fallback: just take the number of words
            bestMatchEndIndex = Math.min(subtitles.length - 1, bestMatchStartIndex + segmentWords.length - 1);
        }

        // 3. Update Duration
        if (bestMatchStartIndex <= bestMatchEndIndex && bestMatchStartIndex < subtitles.length) {
            const startFrame = subtitles[bestMatchStartIndex].start;
            const endFrame = subtitles[bestMatchEndIndex].end;

            // Duration in seconds (assuming 30fps as per agents.ts)
            // The segment.duration is expected in seconds.
            const newDurationSeconds = (endFrame - startFrame) / 30;

            // Safety check: ensure duration is positive and reasonable (e.g. > 0.1s)
            if (newDurationSeconds > 0.1) {
                segment.duration = parseFloat(newDurationSeconds.toFixed(2));
            }

            // Prepare for next iteration
            currentSubtitleIndex = bestMatchEndIndex + 1;
        } else {
            // Alignment failed for this segment, keep old duration or just advance?
            // Advance cursor by estimated word count
            currentSubtitleIndex += segmentWords.length;
        }
    }

    // Add 1 second padding to the last segment as requested by user
    // "make sure total duration is 1 sec biggen then audio lenght as well so we can pad extra sec at the end"
    if (alignedSegments.length > 0) {
        const lastSegment = alignedSegments[alignedSegments.length - 1];
        lastSegment.duration += 1.0;
    }

    // Log statistics
    if (alignedSegments.length > 0) {
        const totalSegmentDuration = alignedSegments.reduce((acc, seg) => acc + seg.duration, 0);
        let totalAudioDuration = 0;
        if (subtitles.length > 0) {
            const lastSub = subtitles[subtitles.length - 1];
            if (lastSub) {
                // Convert frames to seconds (assuming 30fps)
                totalAudioDuration = lastSub.end / 30;
            }
        }
        console.log(`[Alignment] Total Segment Duration (with padding): ${totalSegmentDuration.toFixed(2)}s`);
        console.log(`[Alignment] Total Audio Duration (from subtitles): ${totalAudioDuration.toFixed(2)}s`);
    }

    return alignedSegments;
}
