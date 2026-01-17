
import { db } from '../db/index.js';
import { renderJob, video, subtitleStyle, script } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { Processor } from './types.js';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { VideoRendererInput, SubtitleSegment, VideoSegment, ScriptContent } from '../types.js';
import { compressVideo } from '../lib/video.js';
import { deductCredits } from '../services/credit-service.js';
import { logger } from '../lib/logger.js';
import { getSignedUrlForKey, uploadToS3 } from '../lib/s3.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Check if we're running in production environment
 */
function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Recursively delete a directory and all its contents
 */
function deleteDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

/**
 * Delete all files and directories older than the specified age in the base work directory
 */
function cleanupOldFiles(baseWorkDir: string, maxAgeMs: number = TWO_HOURS_MS): void {
    if (!fs.existsSync(baseWorkDir)) {
        return;
    }

    const now = Date.now();
    const entries = fs.readdirSync(baseWorkDir, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(baseWorkDir, entry.name);
        try {
            const stats = fs.statSync(entryPath);
            const age = now - stats.mtimeMs;

            if (age > maxAgeMs) {
                if (entry.isDirectory()) {
                    deleteDirectory(entryPath);
                    logger.info(`[VideoProcessor] Cleaned up old directory: ${entry.name}`, { age: Math.round(age / 1000 / 60) + ' minutes' });
                } else {
                    fs.unlinkSync(entryPath);
                    logger.info(`[VideoProcessor] Cleaned up old file: ${entry.name}`, { age: Math.round(age / 1000 / 60) + ' minutes' });
                }
            }
        } catch (err) {
            logger.warn(`[VideoProcessor] Failed to cleanup ${entryPath}:`, { error: err });
        }
    }
}

export class VideoProcessor implements Processor {
    name = 'VideoProcessor';

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

            const scriptJson = scriptData.content as ScriptContent;
            const topLevelSubtitles = scriptJson.subtitles || [];
            const segments = scriptJson.segments || [];
            let scriptUpdated = false;

            // Helper to check validity
            const now = new Date();
            const isValidSignedUrl = (url?: string, expiresAt?: string | Date) => {
                if (!url || !expiresAt) return false;
                const expiry = new Date(expiresAt);
                // Buffer of 5 minutes
                return expiry.getTime() > (now.getTime() + 5 * 60000);
            };

            // Resolve Audio URL (S3 or fallback)
            let audioUrl = "";
            if (isValidSignedUrl(scriptJson.audioSignedUrl, scriptJson.audioSignedUrlExpiresAt)) {
                audioUrl = scriptJson.audioSignedUrl!;
                logger.info(`[VideoProcessor] Using cached signed URL for audio`, logContext);
            } else {
                let s3Key = scriptJson.audioKey;
                if (!s3Key) {
                    s3Key = `videos/${job.videoId}/audio.wav`;
                    logger.info(`[VideoProcessor] Constructed fallback audio S3 key`, logContext);
                }
                
                try {
                    const { url, expiresAt } = await getSignedUrlForKey(s3Key);
                    audioUrl = url;
                    
                    // Update script with new signed URL
                    scriptJson.audioSignedUrl = url;
                    scriptJson.audioSignedUrlExpiresAt = expiresAt.toISOString();
                    scriptUpdated = true;
                    
                    logger.info(`[VideoProcessor] Generated and cached signed URL for audio`, logContext);
                } catch (err) {
                    logger.error(`[VideoProcessor] Failed to sign audio URL`, { ...logContext, error: err });
                    // If signing fails, we might still try to use the key if local? 
                    // But we removed local support. So this will likely fail later.
                }
            }

            // Process Segments (Update script in place and map for renderer)
            const processedSegments: VideoSegment[] = [];
            
            for (let i = 0; i < segments.length; i++) {
                const s = segments[i];
                let imageUrl = s.imageAssetPath;
                let segmentUpdated = false;

                if (isValidSignedUrl(s.imageSignedUrl, s.imageSignedUrlExpiresAt)) {
                    imageUrl = s.imageSignedUrl!;
                } else {
                    let keyToSign = s.imageKey;
                    
                    // Fallback logic for key detection
                    if (!keyToSign && s.imageAssetPath && !s.imageAssetPath.startsWith('http')) {
                         if (s.imageAssetPath.includes('videos/')) {
                             keyToSign = s.imageAssetPath;
                         }
                    }

                    if (keyToSign) {
                        try {
                            const { url, expiresAt } = await getSignedUrlForKey(keyToSign);
                            imageUrl = url;
                            
                            // Update segment in script
                            s.imageSignedUrl = url;
                            s.imageSignedUrlExpiresAt = expiresAt.toISOString();
                            // Ensure imageKey is set if we found it via fallback
                            if (!s.imageKey) s.imageKey = keyToSign;
                            
                            segmentUpdated = true;
                            scriptUpdated = true;
                        } catch (err) {
                            logger.warn(`[VideoProcessor] Failed to sign image key for segment ${i}`, { ...logContext, error: err });
                        }
                    }
                }

                // Add to processed segments for renderer
                processedSegments.push({
                    imageAssetPath: imageUrl || "", // Renderer expects a string
                    duration: s.duration || 0,
                    imageEffect: s.imageEffect as any
                });
            }

            // Persist updated script content if needed
            if (scriptUpdated) {
                await db.update(script)
                    .set({ 
                        content: scriptJson,
                        updatedAt: new Date()
                    })
                    .where(eq(script.id, scriptData.id));
                logger.info(`[VideoProcessor] Persisted updated signed URLs to script`, logContext);
            }

            const inputProps: VideoRendererInput = {
                audioUrl: audioUrl,
                subtitleClassName,
                subtitleStyle: customSubtitleStyle,
                subtitleLocation: metadata?.subtitleLocation || 'center',
                subtitleTemplateId,
                segments: processedSegments,
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
            const originalUrl = await uploadToS3(outputLocation, `renders/${job.id}_original.mp4`, 'video/mp4');

            // Compress
            logger.info("[VideoProcessor] Compressing...", logContext);
            const compressedLocation = path.join(workDir, `${job.id}_compressed.mp4`);
            await compressVideo(outputLocation, compressedLocation);

            // Upload Compressed
            const compressedUrl = await uploadToS3(compressedLocation, `renders/${job.id}.mp4`, 'video/mp4');

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

            // Cleanup resources in production environment
            if (isProduction()) {
                try {
                    // Delete job-specific work directory
                    deleteDirectory(workDir);
                    logger.info(`[VideoProcessor] Cleaned up work directory: ${workDir}`, logContext);

                    // Also cleanup any old files (older than 2 hours) in the base work directory
                    cleanupOldFiles(baseWorkDir);
                } catch (cleanupErr) {
                    logger.warn(`[VideoProcessor] Failed to cleanup resources:`, { ...logContext, error: cleanupErr });
                }
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
