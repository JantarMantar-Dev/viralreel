
import dotenv from 'dotenv';
import { Processor } from './processors/types.js';
import { ScriptProcessor } from './processors/script-processor.js';
import { AiProcessor } from './processors/ai-processor.js';
import { VideoProcessor } from './processors/video-processor.js';

dotenv.config();

const POLLING_INTERVAL = 3000; // 3 seconds
const WORKER_ID = process.env.WORKER_ID || `worker-${Math.random().toString(36).substring(7)}`;

async function startUnifiedWorker() {
    console.log(`[UnifiedWorker] Starting worker ${WORKER_ID}...`);

    // Register Processors
    // Order matters if we want to prioritize certain phases. 
    // Usually downstream (video) takes longer so we might want to unblock upstream first?
    // Or FIFO? 
    // Let's iterate them in order: Script -> AI -> Video
    const processors: Processor[] = [
        new ScriptProcessor(),
        new AiProcessor(),
        new VideoProcessor()
    ];

    console.log(`[UnifiedWorker] Registered processors: ${processors.map(p => p.name).join(', ')}`);

    let isRunning = true;

    // Graceful shutdown
    process.on('SIGTERM', () => { isRunning = false; });
    process.on('SIGINT', () => { isRunning = false; });

    while (isRunning) {
        let worked = false;

        try {
            for (const processor of processors) {
                // Try to find a job
                const job = await processor.findAndLockJob();

                if (job) {
                    worked = true;
                    // Process it
                    // Note: We process one job at a time synchronously in this thread
                    // to avoid overloading the container if it's CPU bound (like video rendering)
                    try {
                        await processor.process(job);
                    } catch (err) {
                        console.error(`[UnifiedWorker] Error processing job ${job.id} with ${processor.name}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error("[UnifiedWorker] Error in main loop:", err);
        }

        if (!worked) {
            // Sleep if no work found in any queue
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        } else {
            // If we did work, maybe sleep a tiny bit less or not at all?
            // Let's add a small yield to be nice to CPU
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`[UnifiedWorker] Worker ${WORKER_ID} stopped.`);
}

startUnifiedWorker().catch(err => {
    console.error("[UnifiedWorker] Fatal error:", err);
    process.exit(1);
});
