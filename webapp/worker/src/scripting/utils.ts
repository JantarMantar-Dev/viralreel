
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Ensures a directory exists, then writes data to a file.
 * @param workDir Absolute path to the work directory (e.g., /app/work_dir/videoId)
 * @param fileName Name of the file (e.g., script.json)
 * @param data Data to write (string or Buffer)
 */
export async function writeToFile(workDir: string, fileName: string, data: string | Buffer): Promise<string> {
    await fs.mkdir(workDir, { recursive: true });
    const filePath = path.join(workDir, fileName);
    await fs.writeFile(filePath, data);
    return filePath;
}

/**
 * Resolves the absolute work directory for a given video ID.
 * @param videoId The ID of the video
 * @returns The absolute path to the video's work directory
 */
export async function resolveWorkDir(videoId: string): Promise<string> {
    let baseDir = process.env.VIDEO_WORK_DIR;
    if (!baseDir) {
        baseDir = path.resolve(process.cwd(), 'work_dir');
    }

    // Secondary check for container vs host environment
    try {
        await fs.access(baseDir);
    } catch {
        baseDir = path.resolve(process.cwd(), 'work_dir');
        await fs.mkdir(baseDir, { recursive: true });
    }

    return path.resolve(baseDir, videoId);
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
    header.write('RIFF', 0); // ChunkID
    header.writeUInt32LE(totalSize - 8, 4); // ChunkSize
    header.write('WAVE', 8); // Format

    // fmt sub-chunk
    header.write('fmt ', 12); // Subchunk1ID
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(byteRate, 28); // ByteRate
    header.writeUInt16LE(blockAlign, 32); // BlockAlign
    header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

    // data sub-chunk
    header.write('data', 36); // Subchunk2ID
    header.writeUInt32LE(dataSize, 40); // Subchunk2Size

    return Buffer.concat([header, pcmData]);
}
