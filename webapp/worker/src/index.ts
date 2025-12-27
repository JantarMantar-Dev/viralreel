
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

        // Mocking props for now based on what we expected in metadata
        // In reality, we'd parse videoData.metadata to extract script, audio, images
        const inputProps = {
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
        });

        // 3. Select Composition
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'MyComp',
            inputProps,
        });

        // 4. Render
        console.log("Rendering...");
        console.log("Input Props being sent to render:", JSON.stringify(inputProps, null, 2));

        const outputLocation = path.join(process.cwd(), 'out', `${job.id}.mp4`);
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
                status: 'COMPLETED',
                progress: 100,
                completedAt: new Date(),
                // outputUrl: publicUrl // Schema doesn't have outputUrl on renderJob? It does in video app description, checking schema.ts
                // Schema has outputUrl on VIDEO table.
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
            // Find a QUEUED job
            // Using transaction to lock would be better, but keeping simple for now
            const jobs = await db.select()
                .from(renderJob)
                .where(eq(renderJob.status, 'QUEUED'))
                .limit(1);

            if (jobs.length > 0) {
                const job = jobs[0];

                // Optimistically lock/claim
                const updated = await db.update(renderJob)
                    .set({
                        status: 'PROCESSING',
                        workerId: WORKER_ID,
                        startedAt: new Date()
                    })
                    .where(and(
                        eq(renderJob.id, job.id),
                        eq(renderJob.status, 'QUEUED')
                    ))
                    .returning();

                if (updated.length > 0) {
                    await processJob(updated[0]);
                }
            } else {
                // console.log("No jobs found. Sleeping...");
            }
        } catch (err) {
            console.error("Worker Loop Error:", err);
        }

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
}

const WORKER_SIZE = parseInt(process.env.WORKER_SIZE || '1', 10);
console.log(`Starting ${WORKER_SIZE} worker threads...`);

for (let i = 0; i < WORKER_SIZE; i++) {
    startWorker().catch(err => {
        console.error(`Worker thread ${i} failed:`, err);
    });
}
