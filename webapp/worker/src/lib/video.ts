import { spawn } from 'child_process';
import { logger } from './logger';

export async function compressVideo(inputPath: string, outputPath: string, options: { crf?: number, preset?: string } = {}) {
    const { crf = 32, preset = 'veryfast' } = options;

    return new Promise<void>((resolve, reject) => {
        logger.info(`[VideoLib] Compressing video from ${inputPath} to ${outputPath} with CRF ${crf} and preset ${preset}`);
        
        // -movflags +faststart moves metadata to front for faster streaming
        // -y forces overwrite of output file if it exists
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-vcodec', 'libx264',
            '-crf', String(crf),
            '-preset', preset,
            '-acodec', 'aac',
            '-movflags', '+faststart',
            outputPath
        ]);

        // Capture stderr for logging if needed, but primarily to ensure buffer doesn't fill up
        ffmpeg.stderr.on('data', (data) => {
            // Optional: debug log for detailed ffmpeg output
            // logger.debug(`[ffmpeg] ${data.toString()}`);
        });

        ffmpeg.on('error', (err) => {
            logger.error("Compression process error:", { error: err });
            reject(err);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                const error = new Error(`ffmpeg exited with code ${code}`);
                logger.error("Compression failed:", { error });
                reject(error);
            }
        });
    });
}
