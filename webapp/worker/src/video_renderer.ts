
import { db } from './db/index.js';
import { renderJob, video } from './db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const WORKER_ID = `worker-${Math.random().toString(36).substring(7)}`;
const POLLING_INTERVAL = 5000;

// S3 Client Setup
const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT_URL,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true // Needed for Wasabi usually
});

async function uploadToS3(filePath: string, key: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: 'video/mp4',
        ACL: 'public-read', // Assuming public access for now
    };

    try {
        await s3.send(new PutObjectCommand(uploadParams as any));
        // Construct public URL (naive implementation, verify with specific S3 provider)
        const endpoint = process.env.S3_ENDPOINT_URL || '';
        const bucket = process.env.S3_BUCKET_NAME || '';
        // If Wasabi/S3, typical pattern:
        return `${endpoint}/${bucket}/${key}`;
    } catch (err) {
        console.error("S3 Upload Error:", err);
        throw err;
    }
}

async function processJob(job: typeof renderJob.$inferSelect) {
    console.log(`Processing Job ID: ${job.id} for Video ID: ${job.videoId}`);

    try {
        // 1. Fetch Video Metadata
        const videoData = await db.query.video.findFirst({
            where: eq(video.id, job.videoId)
        });

        if (!videoData) {
            throw new Error(`Video not found for ID: ${job.videoId}`);
        }

        // Use metadata for inputProps if available, otherwise use mock default
        const metadata = videoData.metadata as any;
        const inputProps = metadata?.inputProps || {
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            subtitleStyle: {
                color: 'yellow',
                fontSize: 60,
                textTransform: 'uppercase'
            },
            segments: [
                {
                    image: "https://picsum.photos/id/10/1080/1920",
                    duration: 5,
                    imageEffect: 'ken-burns',
                    subtitles: [
                        { text: "Welcome", start: 0, end: 30 },
                        { text: "to", start: 30, end: 45 },
                        { text: "ViralReel", start: 45, end: 90 }
                    ]
                },
                {
                    image: "https://picsum.photos/id/11/1080/1920",
                    duration: 5,
                    subtitles: [
                        { text: "Create", start: 0, end: 30 },
                        { text: "amazing", start: 30, end: 60 },
                        { text: "videos", start: 60, end: 90 }
                    ]
                }
            ]
        };

        // 2. Bundle Remotion (This usually happens once or cached, but doing per-job for simplicity)
        // Using the deployed bundle path or bundling on the fly
        const entryPoint = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx');
        console.log("Bundling...");
        const bundleLocation = await bundle({
            entryPoint,
            // If reusing bundle, pass logic here
            webpackOverride: (config) => {
                return {
                    ...config,
                    resolve: {
                        ...config.resolve,
                        extensionAlias: {
                            ".js": [".ts", ".tsx", ".js", ".jsx"],
                        },
                    },
                };
            },
        });

        // 3. Select Composition
        // Extract templateId from metadata or default to 'simple'
        const templateId = (videoData.metadata as any)?.templateId || 'simple';
        console.log(`Selecting composition for template: ${templateId}`);

        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: templateId,
            inputProps,
        });

        // 4. Render
        console.log("Rendering...");
        console.log("Input Props being sent to render:", JSON.stringify(inputProps, null, 2));

        const workDir = process.env.VIDEO_WORK_DIR || path.join(process.cwd(), 'out');
        if (!fs.existsSync(workDir)) {
            fs.mkdirSync(workDir, { recursive: true });
        }

        const outputLocation = path.join(workDir, `${job.id}.mp4`);
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps,
            dumpBrowserLogs: true,
        });
        console.log(`Rendered to ${outputLocation}`);

        // 5. Upload
        console.log("Uploading...");
        const publicUrl = await uploadToS3(outputLocation, `renders/${job.id}.mp4`);
        console.log(`Uploaded to ${publicUrl}`);

        // 6. Update DB
        await db.update(renderJob)
            .set({
                status: 'VIDEO_COMPLETED',
                progress: 100,
                completedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(renderJob.id, job.id));

        await db.update(video)
            .set({
                status: 'COMPLETED',
                outputUrl: publicUrl
            })
            .where(eq(video.id, job.videoId));

    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error);
        await db.update(renderJob)
            .set({
                status: 'FAILED',
                error: error.message,
                completedAt: new Date()
            })
            .where(eq(renderJob.id, job.id));

        await db.update(video)
            .set({ status: 'FAILED' })
            .where(eq(video.id, job.videoId));
    }
}

async function startWorker() {
    console.log(`Worker ${WORKER_ID} started. Polling for jobs...`);

    while (true) {
        try {
            await db.transaction(async (tx) => {
                // 1. Find a QUEUED job and lock it (SKIP LOCKED)
                const jobs = await tx.select()
                    .from(renderJob)
                    .where(eq(renderJob.status, 'VIDEO_QUEUED'))
                    .limit(1)
                    .for('update', { skipLocked: true });

                if (jobs.length > 0) {
                    const job = jobs[0];

                    // 2. Mark as PROCESSING immediately
                    // We must await this update within the transaction so the lock is held
                    // until the status change is committed.
                    await tx.update(renderJob)
                        .set({
                            status: 'VIDEO_PROCESSING',
                            workerId: WORKER_ID,
                            startedAt: new Date(),
                            updatedAt: new Date()
                        })
                        .where(eq(renderJob.id, job.id));

                    return job;
                }
            }).then(async (pickedJob) => {
                // 3. Process the job outside the transaction (but status is already PROCESSING)
                // This ensures the transaction is short-lived.
                if (pickedJob) {
                    await processJob(pickedJob);
                }
            });

        } catch (err) {
            console.error("Worker Loop Error:", err);
        }

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
}

const VIDEO_WORKER_SIZE = parseInt(process.env.VIDEO_WORKER_SIZE || '1', 10);
console.log(`Starting ${VIDEO_WORKER_SIZE} video worker threads...`);

for (let i = 0; i < VIDEO_WORKER_SIZE; i++) {
    startWorker().catch(err => {
        console.error(`Video worker thread ${i} failed:`, err);
    });
}
