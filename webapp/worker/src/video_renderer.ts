import dotenv from 'dotenv';
import { VideoProcessor } from './processors/video-processor.js';
import { logger } from './lib/logger.js';

dotenv.config();

const POLLING_INTERVAL = 3000; // 3 seconds
const WORKER_ID = process.env.WORKER_ID || `video-worker-${Math.random().toString(36).substring(7)}`;

async function startVideoWorker() {
    logger.info(`[VideoWorker] Starting worker ${WORKER_ID}...`, { workerId: WORKER_ID });

    const processor = new VideoProcessor();
    logger.info(`[VideoWorker] Registered processor: ${processor.name}`, { workerId: WORKER_ID });

    let isRunning = true;

    // Graceful shutdown
    process.on('SIGTERM', () => { isRunning = false; });
    process.on('SIGINT', () => { isRunning = false; });

    while (isRunning) {
        let worked = false;

        try {
            const job = await processor.findAndLockJob();

            if (job) {
                worked = true;
                try {
                    await processor.process(job);
                } catch (err) {
                    logger.error(`[VideoWorker] Error processing job ${job.id}:`, {
                        workerId: WORKER_ID,
                        jobId: job.id,
                        error: err
                    });
                }
            }
        } catch (err) {
            logger.error("[VideoWorker] Error in main loop:", { workerId: WORKER_ID, error: err });
        }

        if (!worked) {
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    logger.info(`[VideoWorker] Worker ${WORKER_ID} stopped.`, { workerId: WORKER_ID });
}

startVideoWorker().catch(err => {
    logger.error("[VideoWorker] Fatal error:", { error: err });
    process.exit(1);
});
