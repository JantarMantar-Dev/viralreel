
import { db } from '../db/index.js';
import { renderJob } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { Processor } from './types.js';
import { ScriptingJob } from '../scripting/index.js';

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
                return job;
            }
            return null;
        });
    }

    async process(job: typeof renderJob.$inferSelect): Promise<void> {
        console.log(`[ScriptProcessor] Processing Job ID: ${job.id}`);
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

            console.log(`[ScriptProcessor] Completed Job ID: ${job.id}`);
        } catch (error: any) {
            console.error(`[ScriptProcessor] Failed Job ID: ${job.id}`, error);
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
}
