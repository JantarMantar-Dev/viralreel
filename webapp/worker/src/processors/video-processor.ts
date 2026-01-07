
import { db } from '../db/index.js';
import { renderJob, video, subtitleStyle, script } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { Processor } from './types.js';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { VideoRendererInput, SubtitleSegment, VideoSegment } from '../types.js';
import http from 'http';
import { URL, fileURLToPath } from 'url';
import { compressVideo } from '../lib/video.js';
import { deductCredits } from '../services/credit-service.js';
import { logger } from '../lib/logger.js';

export class VideoProcessor implements Processor {
    name = 'VideoProcessor';
    private serverStarted = false;
    private localServerPort = 0;
    private s3: S3Client;

    constructor() {
        this.s3 = new S3Client({
            region: process.env.S3_REGION || 'us-east-1',
            endpoint: process.env.S3_ENDPOINT_URL,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            },
            forcePathStyle: true
        });
    }

    private async ensureServer() {
        if (!this.serverStarted) {
            this.localServerPort = await this.startStaticServer([process.cwd()]);
            this.serverStarted = true;
        }
    }

    private startStaticServer(rootPaths: string[]): Promise<number> {
        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                if (!req.url) {
                    res.writeHead(404);
                    res.end();
                    return;
                }
                try {
                    const parsedUrl = new URL(req.url, `http://localhost`);
                    const relativePath = parsedUrl.pathname.replace(/^\//, '');
                    const filePath = path.resolve(process.cwd(), relativePath);

                    const ext = path.extname(filePath).toLowerCase();
                    const mimeTypes: Record<string, string> = {
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.wav': 'audio/wav',
                        '.mp3': 'audio/mpeg',
                        '.json': 'application/json',
                        '.mp4': 'video/mp4'
                    };
                    const contentType = mimeTypes[ext] || 'application/octet-stream';

                    fs.stat(filePath, (err, stats) => {
                        if (err || !stats.isFile()) {
                            res.writeHead(404);
                            res.end('Not Found');
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': contentType });
                        fs.createReadStream(filePath).pipe(res);
                    });
                } catch (e) {
                    console.error("Server Error:", e);
                    res.writeHead(500);
                    res.end();
                }
            });

            server.listen(0, () => {
                const address = server.address();
                if (typeof address === 'object' && address) {
                    resolve(address.port);
                } else {
                    reject(new Error("Could not determine port"));
                }
            });
        });
    }

    private async uploadToS3(filePath: string, key: string): Promise<string> {
        const fileStream = fs.createReadStream(filePath);
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: 'video/mp4',
            ACL: 'public-read',
        };

        await this.s3.send(new PutObjectCommand(uploadParams as any));
        const endpoint = process.env.S3_ENDPOINT_URL || '';
        const bucket = process.env.S3_BUCKET_NAME || '';
        return `${endpoint}/${bucket}/${key}`;
    }

    async findAndLockJob(): Promise<typeof renderJob.$inferSelect | null> {
        return await db.transaction(async (tx) => {
            const jobs = await tx.select()
                .from(renderJob)
                .where(
                    or(
                        eq(renderJob.status, 'VIDEO_QUEUED'),
                        eq(renderJob.status, 'AI_ASSET_GEN_COMPLETED')
                    )
                )
                .limit(1)
                .for('update', { skipLocked: true });

            if (jobs.length > 0) {
                const job = jobs[0];
                await tx.update(renderJob)
                    .set({
                        status: 'VIDEO_PROCESSING',
                        workerId: process.env.WORKER_ID || `video-${Math.random().toString(36).substring(7)}`,
                        startedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));

                await tx.update(video)
                    .set({
                        status: 'GENERATING',
                        updatedAt: new Date()
                    })
                    .where(eq(video.id, job.videoId));

                return job;
            }
            return null;
        });
    }

    async process(job: typeof renderJob.$inferSelect): Promise<void> {
        const logContext = { videoId: job.videoId, jobId: job.id, workerId: process.env.WORKER_ID };
        logger.info(`[VideoProcessor] Processing Job`, logContext);

        try {
            // 1. Fetch Video Metadata
            const videoData = await db.query.video.findFirst({
                where: eq(video.id, job.videoId)
            });
            if (!videoData) throw new Error(`Video not found ${job.videoId}`);

            // Subtitle Style
            const metadata = videoData.metadata as any;
            let subtitleClassName = "";
            let customSubtitleStyle: any = {};
            let subtitleTemplateId: string | undefined = undefined;

            const styleId = metadata?.subtitleTemplateId || metadata?.subtitleStyleId;
            if (styleId) {
                const style = await db.query.subtitleStyle.findFirst({ where: eq(subtitleStyle.id, styleId) });
                if (style) {
                    subtitleClassName = style.css || "";
                    subtitleTemplateId = style.name.toLowerCase().replace(/\s+/g, '-');
                    customSubtitleStyle = { color: style.fontColor || 'white', fontSize: style.fontSize || 50, fontFamily: style.fontName || 'sans-serif' };
                }
            }

            // Script content
            const baseWorkDir = process.env.VIDEO_WORK_DIR || path.join(process.cwd(), 'work_dir');
            const workDir = path.join(baseWorkDir, job.videoId);
            const scriptData = await db.query.script.findFirst({ where: eq(script.videoId, job.videoId) });
            if (!scriptData) throw new Error(`Script not found`);

            const scriptJson = scriptData.content as any;
            const topLevelSubtitles = scriptJson.subtitles || [];
            const segments = scriptJson.segments || [];

            await this.ensureServer();

            const toLocalUrl = (filePath: string) => {
                if (filePath.startsWith('http')) return filePath;
                let cleanPath = filePath;
                if (cleanPath.startsWith('file://')) {
                    try {
                        cleanPath = fileURLToPath(cleanPath);
                    } catch { } // Ignore error
                }
                cleanPath = cleanPath.replace('file://', '');

                const relPath = path.isAbsolute(cleanPath) ? path.relative(process.cwd(), cleanPath) : cleanPath;
                return `http://localhost:${this.localServerPort}/${relPath}`;
            };

            const inputProps: VideoRendererInput = {
                audioUrl: toLocalUrl(path.join(workDir, 'audio.wav')),
                subtitleClassName,
                subtitleStyle: customSubtitleStyle,
                subtitleLocation: metadata?.subtitleLocation || 'center',
                subtitleTemplateId,
                segments: segments.map((s: any) => ({ ...s, imageAssetPath: toLocalUrl(s.imageAssetPath), duration: s.duration })),
                subtitles: topLevelSubtitles
            };

            // Bundle
            logger.info("[VideoProcessor] Bundling Remotion...", logContext);
            const entryPoint = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx');
            const bundleLocation = await bundle({
                entryPoint,
                webpackOverride: (config) => ({ ...config, resolve: { ...config.resolve, extensionAlias: { ".js": [".ts", ".tsx", ".js", ".jsx"] } } }),
            });

            // Composition
            const templateId = (videoData.metadata as any)?.templateId || 'simple';
            const composition = await selectComposition({
                serveUrl: bundleLocation,
                id: templateId,
                inputProps: inputProps as any,
            });

            // Render
            logger.info("[VideoProcessor] Rendering...", logContext);
            if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

            const outputLocation = path.join(workDir, `${job.id}.mp4`);
            if (fs.existsSync(outputLocation)) fs.unlinkSync(outputLocation);

            await renderMedia({
                composition,
                serveUrl: bundleLocation,
                codec: 'h264',
                outputLocation,
                inputProps: inputProps as any,
                dumpBrowserLogs: true,
            });

            // Upload Original
            logger.info("[VideoProcessor] Uploading original...", logContext);
            const originalUrl = await this.uploadToS3(outputLocation, `renders/${job.id}_original.mp4`);

            // Compress
            logger.info("[VideoProcessor] Compressing...", logContext);
            const compressedLocation = path.join(workDir, `${job.id}_compressed.mp4`);
            await compressVideo(outputLocation, compressedLocation);

            // Upload Compressed
            const compressedUrl = await this.uploadToS3(compressedLocation, `renders/${job.id}.mp4`);

            // Update DB
            await db.update(renderJob)
                .set({ status: 'VIDEO_COMPLETED', progress: 100, completedAt: new Date(), updatedAt: new Date(), originalUrl, compressedUrl, metadata: {} })
                .where(eq(renderJob.id, job.id));

            await db.update(video)
                .set({ status: 'COMPLETED', outputUrl: originalUrl, compressedUrl })
                .where(eq(video.id, job.videoId));

            // Deduct credits
            try {
                await deductCredits(
                    videoData.userId,
                    1,
                    `Video Generation: ${videoData.title}`,
                    videoData.id,
                    videoData.seriesId || undefined
                );
                logger.info(`[VideoProcessor] Deducted 1 credit for user ${videoData.userId}`, logContext);
            } catch (err) {
                logger.error(`[VideoProcessor] Failed to deduct credits for user ${videoData.userId}:`, { ...logContext, error: err });
            }

            logger.info(`[VideoProcessor] Completed Job`, logContext);

        } catch (error: any) {
            const currentRetry = job.retryCount || 0;
            const maxRetries = 2;

            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                logger.warn(`[VideoProcessor] Job failed, retrying (${nextRetry}/${maxRetries})`, {
                    ...logContext,
                    error: error.message,
                    tags: ['retry', `retry-${nextRetry}`],
                    retryCount: nextRetry
                });

                await db.update(renderJob)
                    .set({
                        status: 'VIDEO_QUEUED', // Send back to queue
                        retryCount: nextRetry,
                        error: error.message,
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));
            } else {
                logger.error(`[VideoProcessor] Failed Job`, { ...logContext, error });
                await db.update(renderJob)
                    .set({ status: 'FAILED', error: error.message, completedAt: new Date() })
                    .where(eq(renderJob.id, job.id));
                await db.update(video)
                    .set({ status: 'FAILED' })
                    .where(eq(video.id, job.videoId));
            }
        }
    }
}
