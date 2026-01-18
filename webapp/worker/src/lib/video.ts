import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger';
import fs from 'fs';

const execAsync = promisify(exec);

export async function compressVideo(inputPath: string, outputPath: string, options: { crf?: number, preset?: string } = {}) {
    const { crf = 32, preset = 'veryfast' } = options;
    try {
        // add logic to delete output path if exists
        if (fs.existsSync(outputPath)) {
            logger.info(`[VideoLib] Output path exists, deleting: ${outputPath}`);
            fs.unlinkSync(outputPath);
        }
        logger.info(`[VideoLib] Compressing video from ${inputPath} to ${outputPath} with CRF ${crf} and preset ${preset}`);
        // -movflags +faststart moves metadata to front for faster streaming
        await execAsync(`ffmpeg -i "${inputPath}" -vcodec libx264 -crf ${crf} -preset ${preset} -acodec aac -movflags +faststart "${outputPath}"`);
    } catch (error) {
        logger.error("Compression failed:", { error });
        throw error;
    }
}
