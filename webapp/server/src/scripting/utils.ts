/**
 * Utility functions for scripting - adapted from worker for server use
 */

/**
 * Reconstructs the full story text from the generated subtitles.
 */
export function reconstructStoryFromSubtitles(subtitles: Array<{ text: string; start: number; end: number }>): string {
    if (!subtitles || subtitles.length === 0) {
        return '';
    }
    return subtitles.map(s => s.text).join(' ');
}

/**
 * Adds a WAV header to the PCM data.
 * @param pcmData Raw PCM buffer
 * @param sampleRate Sample rate in Hz (e.g., 24000)
 * @param numChannels Number of channels (e.g., 1 for mono)
 * @param bitsPerSample Bits per sample (e.g., 16)
 */
export function addWavHeader(pcmData: Buffer, sampleRate: number, numChannels: number, bitsPerSample: number): Buffer {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const header = Buffer.alloc(headerSize);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(totalSize - 8, 4);
    header.write('WAVE', 8);

    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmData]);
}
