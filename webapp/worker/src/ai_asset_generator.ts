
import { db } from './db/index.js';
import { renderJob } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const WORKER_ID = `ai-gen-worker-${Math.random().toString(36).substring(7)}`;
const POLLING_INTERVAL = 5000;


import * as path from 'path';
import { script, video } from './db/schema.js';
import { ImageGenerator } from './ai/image_generator.js';
import { inArray } from 'drizzle-orm';
import * as fs from 'fs/promises';
import { ScriptContent, ScriptSegment, VideoRendererInput, VideoSegment } from './types.js';

const imageGenerator = new ImageGenerator();

async function processAiGen(job: typeof renderJob.$inferSelect) {
    console.log(`[${WORKER_ID}] AI Gen Job ID: ${job.id} for Video ID: ${job.videoId}`);

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

        console.log(`[${WORKER_ID}] Generating images for ${content.segments.length} segments...`);

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

        // 3. Generate Images for Each Segment
        const updatedSegments: ScriptSegment[] = [];
        for (let i = 0; i < content.segments.length; i++) {
            const segment = content.segments[i];
            const segmentIndex = i;

            // Skip if already has image (idempotency)
            if (segment.imageAssetPath) {
                console.log(`[${WORKER_ID}] Segment ${i} already has image, skipping.`);
                updatedSegments.push(segment);
                continue;
            }

            const prompt = segment.visualPrompt || segment.dialogue;
            if (!prompt) {
                console.warn(`[${WORKER_ID}] Segment ${i} has no visual prompt or dialogue, skipping image gen.`);
                updatedSegments.push(segment);
                continue;
            }

            const fileName = `segment_${segmentIndex}.png`;
            const outputPath = path.join(assetsDir, fileName);

            try {
                // Get aspect ratio and visual style from metadata
                const meta = (await db.select().from(video).where(eq(video.id, job.videoId)).limit(1))[0]?.metadata as any;
                const aspectRatio = meta?.aspectRatio || "16:9";
                const visualStyle = meta?.visualStyle;

                // Generate
                await imageGenerator.generateAndSave(prompt, outputPath, aspectRatio, visualStyle);

                // Update segment
                updatedSegments.push({
                    ...segment,
                    imageAssetPath: outputPath
                });
            } catch (err) {
                console.error(`[${WORKER_ID}] Failed to generate image for segment ${i}:`, err);
                // Keep segment as is, maybe retry later? For now, push execution.
                updatedSegments.push(segment);
                // We might want to fail the job if critical? or continue partial.
                // Continuing for now.
            }

            // Simple rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }

        // 4. Update Script & Video Metadata
        const updatedContent = { ...content, segments: updatedSegments };

        // Save back to script table
        await db.update(script)
            .set({
                content: updatedContent,
                updatedAt: new Date()
            })
            .where(eq(script.id, currentScript.id));

        // Update video metadata as well (for renderer usage)
        const videoData = await db.select().from(video).where(eq(video.id, job.videoId)).limit(1);
        if (videoData.length > 0) {
            const v = videoData[0];
            const meta = v.metadata as any || {};

            // Transform ScriptContent to VideoRendererInput
            const rendererInput: VideoRendererInput = {
                audioUrl: content.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Default/Fallback
                segments: updatedSegments.map(s => ({
                    image: s.imageAssetPath || "", // Should be populated now
                    duration: s.duration || 5, // Default duration
                    subtitles: [], // TODO: Generate subtitles from dialogue
                    imageEffect: (s.imageEffect as any) || 'ken-burns'
                })),
                subtitleStyle: meta.subtitleStyle || { // Use style from video metadata if available
                    color: 'white',
                    fontSize: 50
                }
            };

            await db.update(video)
                .set({
                    metadata: {
                        ...meta,
                        script: updatedContent,
                        inputProps: rendererInput
                    },
                    updatedAt: new Date()
                })
                .where(eq(video.id, job.videoId));
        }

        // 5. Complete Job
        await db.update(renderJob)
            .set({
                status: 'AI_ASSET_GEN_COMPLETED',
                progress: 100,
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(renderJob.id, job.id));

        console.log(`[${WORKER_ID}] AI Gen completed for job ${job.id}`);
    } catch (error: any) {
        console.error(`[${WORKER_ID}] AI Gen failed for job ${job.id}:`, error);
        await db.update(renderJob)
            .set({
                status: 'AI_ASSET_GEN_FAILED',
                error: error.message,
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(renderJob.id, job.id));
    }
}

async function startWorker() {
    console.log(`Worker ${WORKER_ID} started. Polling for SCRIPT_READY and AI_ASSET_GEN_QUEUED jobs...`);

    while (true) {
        try {
            await db.transaction(async (tx) => {
                // 1. Find a job to process
                const jobs = await tx.select()
                    .from(renderJob)
                    .where(inArray(renderJob.status, ['SCRIPT_READY', 'AI_ASSET_GEN_QUEUED']))
                    .limit(1)
                    .for('update', { skipLocked: true });

                if (jobs.length > 0) {
                    const job = jobs[0];

                    // 2. Mark as AI_ASSET_GEN_PROCESSING
                    await tx.update(renderJob)
                        .set({
                            status: 'AI_ASSET_GEN_PROCESSING',
                            workerId: WORKER_ID,
                            startedAt: new Date(),
                            updatedAt: new Date()
                        })
                        .where(eq(renderJob.id, job.id));

                    return job;
                }
            }).then(async (pickedJob) => {
                if (pickedJob) {
                    await processAiGen(pickedJob);
                }
            });
        } catch (err) {
            console.error(`[${WORKER_ID}] Worker Loop Error:`, err);
        }
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
}

const AI_GEN_WORKER_SIZE = parseInt(process.env.AI_GEN_WORKER_SIZE || '1', 10);
console.log(`Starting ${AI_GEN_WORKER_SIZE} AI gen worker threads...`);

for (let i = 0; i < AI_GEN_WORKER_SIZE; i++) {
    console.log(`Starting AI gen worker thread ${i}...`);
    // startWorker().catch(err => {
    //     console.error(`AI gen worker thread ${i} failed:`, err);
    // });
}
