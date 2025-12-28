
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
