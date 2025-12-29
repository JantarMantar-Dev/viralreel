import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function compressVideo(inputPath: string, outputPath: string, options: { crf?: number, preset?: string } = {}) {
    const { crf = 32, preset = 'veryfast' } = options;
    try {
        // -movflags +faststart moves metadata to front for faster streaming
        await execAsync(`ffmpeg -i "${inputPath}" -vcodec libx264 -crf ${crf} -preset ${preset} -acodec aac -movflags +faststart "${outputPath}"`);
    } catch (error) {
        console.error("Compression failed:", error);
        throw error;
    }
}
