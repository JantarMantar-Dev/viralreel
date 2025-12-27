
import { db } from './db/index.js';
import { renderJob } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const WORKER_ID = `ai-gen-worker-${Math.random().toString(36).substring(7)}`;
const POLLING_INTERVAL = 5000;

async function processAiGen(job: typeof renderJob.$inferSelect) {
    console.log(`[${WORKER_ID}] AI Gen Job ID: ${job.id} for Video ID: ${job.videoId}`);

    try {
        // --- Placeholder Logic ---
        console.log("Hello World from AI Asset Generator!");
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 3000));
        // --- End Placeholder ---

        // Update status to AI_ASSET_GEN_COMPLETED
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
    console.log(`Worker ${WORKER_ID} started. Polling for AI_ASSET_GEN_QUEUED jobs...`);

    while (true) {
        try {
            await db.transaction(async (tx) => {
                // 1. Find an AI_ASSET_GEN_QUEUED job and lock it
                const jobs = await tx.select()
                    .from(renderJob)
                    .where(eq(renderJob.status, 'AI_ASSET_GEN_QUEUED'))
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
    startWorker().catch(err => {
        console.error(`AI gen worker thread ${i} failed:`, err);
    });
}
