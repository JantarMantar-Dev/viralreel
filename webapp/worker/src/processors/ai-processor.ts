
import { db } from '../db/index.js';
import { renderJob, script, video } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { Processor } from './types.js';
import { ImageGenerator } from '../ai/image_generator.js';
import { ScriptContent, ScriptSegment } from '../types.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../lib/logger.js';
import { uploadToS3 } from '../lib/s3.js';

export class AiProcessor implements Processor {
    name = 'AiProcessor';
    private imageGenerator = new ImageGenerator();

    async findAndLockJob(): Promise<typeof renderJob.$inferSelect | null> {
        return await db.transaction(async (tx) => {
            const jobs = await tx.select()
                .from(renderJob)
                .where(inArray(renderJob.status, ['SCRIPT_READY', 'AI_ASSET_GEN_QUEUED']))
                .limit(1)
                .for('update', { skipLocked: true });

            if (jobs.length > 0) {
                const job = jobs[0];
                await tx.update(renderJob)
                    .set({
                        status: 'AI_ASSET_GEN_PROCESSING',
                        workerId: process.env.WORKER_ID || `ai-${Math.random().toString(36).substring(7)}`,
                        startedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));

                // Update video status to GENERATING (since AI gen is part of generation process)
                // Note: Schema has SCRIPT_READY, GENERATING. We'll use GENERATING here as it's active work.
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
        logger.info(`[AiProcessor] Processing Job`, logContext);

        try {
            // 1. Fetch Script
            const scriptData = await db.select()
                .from(script)
                .where(eq(script.videoId, job.videoId))
                .limit(1);

            if (scriptData.length === 0) {
                throw new Error(`Script not found for video ${job.videoId}`);
            }

            const currentScript = scriptData[0];
            const content: ScriptContent = currentScript.content as any;

            if (!content || !content.segments) {
                throw new Error(`Invalid script content for video ${job.videoId}`);
            }

            // 2. Setup Work Directory
            let workDir = process.env.VIDEO_WORK_DIR;
            try {
                if (workDir) {
                    await fs.access(workDir);
                } else {
                    throw new Error('No VIDEO_WORK_DIR');
                }
            } catch {
                workDir = path.resolve(process.cwd(), 'work_dir');
                await fs.mkdir(workDir, { recursive: true });
            }

            const assetsDir = path.join(workDir, job.videoId, 'assets');
            await fs.mkdir(assetsDir, { recursive: true });

            // 3. Generate Images
            const updatedSegments: ScriptSegment[] = [];
            for (let i = 0; i < content.segments.length; i++) {
                const segment = content.segments[i];

                // Skip if already has image
                if (segment.imageAssetPath) {
                    updatedSegments.push(segment);
                    continue;
                }

                const prompt = segment.visualPrompt || segment.dialogue;
                if (!prompt) {
                    updatedSegments.push(segment);
                    continue;
                }

                const fileName = `segment_${i}.png`;
                const outputPath = path.join(assetsDir, fileName);

                try {
                    // Get metadata for style/AR
                    const meta = (await db.select().from(video).where(eq(video.id, job.videoId)).limit(1))[0]?.metadata as any;
                    const aspectRatio = meta?.aspectRatio || "16:9";
                    const visualStyle = meta?.visualStyle;

                    await this.imageGenerator.generateAndSave(prompt, outputPath, aspectRatio, visualStyle);

                    const imageKey = `videos/${job.videoId}/assets/${fileName}`;
                    await uploadToS3(outputPath, imageKey, 'image/png');
                    
                    // Cleanup local file
                    try {
                        await fs.unlink(outputPath);
                    } catch (cleanupErr) {
                        logger.warn(`[AiProcessor] Failed to cleanup local image: ${outputPath}`, { ...logContext, error: cleanupErr });
                    }

                    updatedSegments.push({
                        ...segment,
                        imageKey: imageKey,
                        imageAssetPath: imageKey // For backward compatibility or as a placeholder
                    });
                } catch (err) {
                    logger.error(`[AiProcessor] Failed segment ${i}`, { ...logContext, error: err });
                    updatedSegments.push(segment);
                }

                // Rate limit
                await new Promise(r => setTimeout(r, 1000));
            }

            // Update Script
            const updatedContent = { ...content, segments: updatedSegments };
            await db.update(script)
                .set({
                    content: updatedContent,
                    updatedAt: new Date()
                })
                .where(eq(script.id, currentScript.id));

            // CRITICAL: Update video.metadata.renderData with generated image keys
            // This ensures the unified render schema is up to date for the video processor
            const currentVideo = (await db.select().from(video).where(eq(video.id, job.videoId)).limit(1))[0];
            const meta = (currentVideo?.metadata || {}) as any;
            
            if (meta.renderData) {
                const updatedRenderData = {
                    ...meta.renderData,
                    segments: updatedSegments.map((seg: any) => ({
                        dialogue: seg.dialogue,
                        visualPrompt: seg.visualPrompt,
                        start: seg.start || 0,
                        end: seg.end || 0,
                        duration: seg.duration || 0,
                        imageKey: seg.imageKey, // The key we just generated
                        imageEffect: seg.imageEffect,
                    })),
                    isReady: true
                };

                await db.update(video)
                    .set({
                        metadata: {
                            ...meta,
                            renderData: updatedRenderData
                        },
                        updatedAt: new Date()
                    })
                    .where(eq(video.id, job.videoId));
                    
                logger.info(`[AiProcessor] Updated video.metadata.renderData with generated assets`, logContext);
            }

            // Complete Job
            await db.update(renderJob)
                .set({
                    status: 'AI_ASSET_GEN_COMPLETED',
                    progress: 100,
                    completedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(renderJob.id, job.id));

            logger.info(`[AiProcessor] Completed Job`, logContext);

        } catch (error: any) {
            const currentRetry = job.retryCount || 0;
            const maxRetries = 2;

            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                logger.warn(`[AiProcessor] Job failed, retrying (${nextRetry}/${maxRetries})`, {
                    ...logContext,
                    error: error.message,
                    tags: ['retry', `retry-${nextRetry}`],
                    retryCount: nextRetry
                });

                await db.update(renderJob)
                    .set({
                        status: 'AI_ASSET_GEN_QUEUED', // Send back to AI queue
                        retryCount: nextRetry,
                        error: error.message,
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));

            } else {
                logger.error(`[AiProcessor] Failed Job`, { ...logContext, error });
                await db.update(renderJob)
                    .set({
                        status: 'AI_ASSET_GEN_FAILED',
                        error: error.message,
                        completedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));

                await db.update(video)
                    .set({
                        status: 'FAILED',
                        updatedAt: new Date()
                    })
                    .where(eq(video.id, job.videoId));
            }
        }
    }
}
