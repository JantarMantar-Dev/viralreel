
import { db } from '../db/index.js';
import { renderJob, video, subtitleStyle, script } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { Processor } from './types.js';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, ensureBrowser } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { VideoRendererInput, SubtitleSegment, VideoSegment, ScriptContent } from '../types.js';
import { compressVideo } from '../lib/video.js';
import { deductCredits } from '../services/credit-service.js';
import { logger } from '../lib/logger.js';
import { getSignedUrlForKey, uploadToS3 } from '../lib/s3.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const BASE_WORK_DIR = process.env.VIDEO_WORK_DIR || path.resolve(process.cwd(), 'work_dir');

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

        const workDir = path.join(BASE_WORK_DIR, job.videoId);

        try {

            // 1. Fetch Video Metadata
            const videoData = await db.query.video.findFirst({
                where: eq(video.id, job.videoId)
            });
            if (!videoData) throw new Error(`Video not found ${job.videoId}`);

            // Fetch script data
            const scriptData = await db.query.script.findFirst({ where: eq(script.videoId, job.videoId) });

            // Prepare Input Props (Refactored for testing)
            const inputProps = await this.prepareInputProps(job, videoData, scriptData, logContext);

            // Bundle
            logger.info("[VideoProcessor] Bundling Remotion...", logContext);
            const entryPoint = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx');
            const bundleLocation = await bundle({
                entryPoint,
                webpackOverride: (config) => ({ ...config, resolve: { ...config.resolve, extensionAlias: { ".js": [".ts", ".tsx", ".js", ".jsx"] } } }),
            });

            // Ensure browser is available (will fail fast if not pre-installed)
            const browserExecutablePath = process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
            if (browserExecutablePath) {
                logger.info(`[VideoProcessor] Using Chrome at: ${browserExecutablePath}`, logContext);
            } else {
                logger.warn(`[VideoProcessor] No CHROME_EXECUTABLE_PATH set, Remotion will attempt to find/download browser`, logContext);
            }

            // Composition
            const templateId = (videoData.metadata as any)?.templateId || 'simple';
            const composition = await selectComposition({
                serveUrl: bundleLocation,
                id: templateId,
                inputProps: inputProps as any,
                browserExecutable: browserExecutablePath || null,
                onBrowserDownload: (options) => {
                    logger.info(`[VideoProcessor] Chrome download started for composition. Mode: ${options.chromeMode}`, logContext);
                    return {
                        version: null,
                        onProgress: (info) => {
                            logger.info(`[VideoProcessor] Downloading Chrome for composition: ${info.percent}%`, logContext);
                        }
                    };
                },
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
                browserExecutable: browserExecutablePath || null,
                onBrowserDownload: (options) => {
                    logger.info(`[VideoProcessor] Chrome download started for rendering. Mode: ${options.chromeMode}`, logContext);
                    return {
                        version: null,
                        onProgress: (info) => {
                            logger.info(`[VideoProcessor] Downloading Chrome for rendering: ${info.percent}%`, logContext);
                        }
                    };
                },
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
                    videoData.seriesId || undefined,
                    videoData.title // Pass video title as comment
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
                    cleanupOldFiles(BASE_WORK_DIR);
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

    public async prepareInputProps(
        job: typeof renderJob.$inferSelect,
        videoData: typeof video.$inferSelect,
        scriptData: typeof script.$inferSelect | undefined,
        logContext: any
    ): Promise<VideoRendererInput> {
        // Subtitle Style
        const metadata = videoData.metadata as any;

        // =========================================================================
        // UNIFIED RENDER DATA RESOLUTION
        // =========================================================================
        // We prefer video.metadata.renderData (Unified Schema)
        // But fallback to script.content for backward compatibility

        let audioKey = "";
        let subtitles: SubtitleSegment[] = [];
        let segments: VideoSegment[] = [];
        let renderData = metadata.renderData;

        const scriptJson = scriptData?.content as ScriptContent | undefined;

        if (renderData) {
            logger.info(`[VideoProcessor] Using unified RenderData from metadata`, logContext);
            audioKey = renderData.audioKey;
            subtitles = renderData.subtitles || [];

            // Convert RenderData segments to VideoSegments
            segments = (renderData.segments || []).map((s: any) => {
                let duration = s.duration || 0;
                if (!duration && s.timeRange && Array.isArray(s.timeRange) && s.timeRange.length === 2) {
                    duration = s.timeRange[1] - s.timeRange[0];
                }
                
                return {
                    imageAssetPath: s.imageKey || s.imageAssetPath || "",
                    duration: duration,
                    imageEffect: s.imageEffect
                };
            });

        } else if (scriptJson) {
            logger.info(`[VideoProcessor] Using legacy script content`, logContext);
            audioKey = scriptJson.audioKey || `videos/${job.videoId}/audio.wav`; // Legacy auto mode fallback

            // Check if this is a "broken" editor mode video (old schema)
            if (metadata.editorMode && !scriptJson.audioKey && metadata.audioKey) {
                audioKey = metadata.audioKey;
                logger.info(`[VideoProcessor] Legacy editor mode audio fallback`, logContext);
            }

            subtitles = scriptJson.subtitles || [];
            segments = (scriptJson.segments || []).map(s => ({
                imageAssetPath: s.imageKey || s.imageAssetPath || "",
                duration: s.duration || 0,
                imageEffect: s.imageEffect as any
            }));
        } else {
            throw new Error("No render data or script content found");
        }

        // =========================================================================
        // ASSET URL RESOLUTION (Signing)
        // =========================================================================

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

        // Helper to check validity
        const now = new Date();
        const isValidSignedUrl = (url?: string, expiresAt?: string | Date) => {
            if (!url || !expiresAt) return false;
            const expiry = new Date(expiresAt);
            // Buffer of 5 minutes
            return expiry.getTime() > (now.getTime() + 5 * 60000);
        };

        // Resolve Audio URL
        let audioUrl = "";

        // Check cache in renderData first
        if (renderData && isValidSignedUrl(renderData.audioSignedUrl, renderData.audioSignedUrlExpiresAt)) {
            audioUrl = renderData.audioSignedUrl!;
        }
        // Check cache in legacy script
        else if (scriptJson && isValidSignedUrl(scriptJson.audioSignedUrl, scriptJson.audioSignedUrlExpiresAt)) {
            audioUrl = scriptJson.audioSignedUrl!;
        }
        // Generate new signed URL
        else if (audioKey) {
            try {
                const { url, expiresAt } = await getSignedUrlForKey(audioKey);
                audioUrl = url;

                // Update cache in metadata (if using renderData)
                if (renderData) {
                    renderData.audioSignedUrl = url;
                    renderData.audioSignedUrlExpiresAt = expiresAt.toISOString();

                    await db.update(video)
                        .set({ metadata: { ...metadata, renderData } })
                        .where(eq(video.id, job.videoId));
                }
            } catch (err) {
                logger.error(`[VideoProcessor] Failed to sign audio URL: ${audioKey}`, { ...logContext, error: err });
            }
        }

        // Resolve Image URLs for Segments
        const processedSegments: VideoSegment[] = [];
        for (let i = 0; i < segments.length; i++) {
            const s = segments[i];
            let imageUrl = s.imageAssetPath;

            // If it looks like an S3 key (doesn't start with http), sign it
            if (imageUrl && !imageUrl.startsWith('http')) {
                try {
                    const { url } = await getSignedUrlForKey(imageUrl);
                    imageUrl = url;
                } catch (err) {
                    logger.warn(`[VideoProcessor] Failed to sign image key: ${imageUrl}`, { ...logContext, error: err });
                }
            }

            processedSegments.push({
                imageAssetPath: imageUrl || "",
                duration: s.duration,
                imageEffect: s.imageEffect
            });
        }

        return {
            audioUrl: audioUrl,
            subtitleClassName,
            subtitleStyle: customSubtitleStyle,
            subtitleLocation: metadata?.subtitleLocation || 'center',
            subtitleTemplateId,
            segments: processedSegments,
            subtitles: subtitles
        };
    }
}

