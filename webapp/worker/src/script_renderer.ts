
import { db } from './db/index.js';
import { renderJob } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const WORKER_ID = `script-worker-${Math.random().toString(36).substring(7)}`;
const POLLING_INTERVAL = 5000;

import { ScriptingJob } from './scripting/index.js';

const scriptingJob = new ScriptingJob();

async function processScripting(job: typeof renderJob.$inferSelect) {
    console.log(`[${WORKER_ID}] Scripting Job ID: ${job.id} for Video ID: ${job.videoId}`);

    try {
        await scriptingJob.init(job.videoId);
        await scriptingJob.run();

        // Update status to SCRIPT_READY
        await db.update(renderJob)
            .set({
                status: 'SCRIPT_READY',
                progress: 100,
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(renderJob.id, job.id));

        console.log(`[${WORKER_ID}] Scripting completed for job ${job.id}`);
    } catch (error: any) {
        console.error(`[${WORKER_ID}] Scripting failed for job ${job.id}:`, error);
        await db.update(renderJob)
            .set({
                status: 'SCRIPTING_FAILED',
                error: error.message,
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(renderJob.id, job.id));
    }
}

async function startWorker() {
    console.log(`Worker ${WORKER_ID} started. Polling for QUEUED jobs...`);

    while (true) {
        try {
            await db.transaction(async (tx) => {
                // 1. Find a QUEUED job and lock it
                const jobs = await tx.select()
                    .from(renderJob)
                    .where(eq(renderJob.status, 'QUEUED'))
                    .limit(1)
                    .for('update', { skipLocked: true });

                if (jobs.length > 0) {
                    const job = jobs[0];

                    // 2. Mark as SCRIPTING
                    await tx.update(renderJob)
                        .set({
                            status: 'SCRIPTING',
                            workerId: WORKER_ID,
                            startedAt: new Date(),
                            updatedAt: new Date()
                        })
                        .where(eq(renderJob.id, job.id));

                    return job;
                }
            }).then(async (pickedJob) => {
                if (pickedJob) {
                    await processScripting(pickedJob);
                }
            });
        } catch (err) {
            console.error(`[${WORKER_ID}] Worker Loop Error:`, err);
        }
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
}

const SCRIPT_WORKER_SIZE = parseInt(process.env.SCRIPT_WORKER_SIZE || '1', 10);
console.log(`Starting ${SCRIPT_WORKER_SIZE} script worker threads...`);

for (let i = 0; i < SCRIPT_WORKER_SIZE; i++) {
    startWorker().catch(err => {
        console.error(`Script worker thread ${i} failed:`, err);
    });
}
