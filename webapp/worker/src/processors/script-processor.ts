
import { db } from '../db/index.js';
import { renderJob, video } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { Processor } from './types.js';
import { ScriptingJob } from '../scripting/index.js';
import { logger } from '../lib/logger.js';

export class ScriptProcessor implements Processor {
    name = 'ScriptProcessor';
    private scriptingJob = new ScriptingJob();

    async findAndLockJob(): Promise<typeof renderJob.$inferSelect | null> {
        return await db.transaction(async (tx) => {
            const jobs = await tx.select()
                .from(renderJob)
                .where(eq(renderJob.status, 'QUEUED'))
                .limit(1)
                .for('update', { skipLocked: true });

            if (jobs.length > 0) {
                const job = jobs[0];
                await tx.update(renderJob)
                    .set({
                        status: 'SCRIPTING',
                        workerId: process.env.WORKER_ID || `script-${Math.random().toString(36).substring(7)}`,
                        startedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));

                await tx.update(video)
                    .set({
                        status: 'SCRIPTING',
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
        logger.info(`[ScriptProcessor] Processing Job`, logContext);

        try {
            await this.scriptingJob.init(job.videoId);
            await this.scriptingJob.run();

            await db.update(renderJob)
                .set({
                    status: 'SCRIPT_READY',
                    progress: 100,
                    completedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(renderJob.id, job.id));

            logger.info(`[ScriptProcessor] Completed Job`, logContext);
        } catch (error: any) {
            const currentRetry = job.retryCount || 0;
            const maxRetries = 2;

            if (currentRetry < maxRetries) {
                const nextRetry = currentRetry + 1;
                logger.warn(`[ScriptProcessor] Job failed, retrying (${nextRetry}/${maxRetries})`, {
                    ...logContext,
                    error: error.message,
                    tags: ['retry', `retry-${nextRetry}`],
                    retryCount: nextRetry
                });

                await db.update(renderJob)
                    .set({
                        status: 'QUEUED', // Send back to queue
                        retryCount: nextRetry,
                        error: error.message,
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, job.id));

                // Clean up video status lightly if needed, but usually keeping it in SCRIPTING or waiting is fine.
                // But since we are requeuing, it might be picked up by another worker.
            } else {
                logger.error(`[ScriptProcessor] Failed Job`, { ...logContext, error });
                await db.update(renderJob)
                    .set({
                        status: 'SCRIPTING_FAILED',
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
