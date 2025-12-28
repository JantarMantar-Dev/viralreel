
import { db } from './db/index.js';
import { renderJob, video, subtitleStyle, script } from './db/schema.js';
import { eq, and, sql, or } from 'drizzle-orm';
import dotenv from 'dotenv';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { VideoRendererInput, SubtitleSegment, VideoSegment } from './types.js';
import http from 'http';
import { URL, fileURLToPath } from 'url';

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

// --- Static Server for Assets ---
let LOCAL_SERVER_PORT = 0;

function startStaticServer(rootPaths: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            if (!req.url) {
                res.writeHead(404);
                res.end();
                return;
            }

            try {
                const parsedUrl = new URL(req.url, `http://localhost`);
                const relativePath = parsedUrl.pathname.replace(/^\//, '');
                const filePath = path.resolve(process.cwd(), relativePath);

                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.wav': 'audio/wav',
                    '.mp3': 'audio/mpeg',
                    '.json': 'application/json',
                    '.mp4': 'video/mp4'
                };

                const contentType = mimeTypes[ext] || 'application/octet-stream';

                fs.stat(filePath, (err, stats) => {
                    if (err || !stats.isFile()) {
                        res.writeHead(404);
                        res.end('Not Found');
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': contentType });
                    fs.createReadStream(filePath).pipe(res);
                });
            } catch (e) {
                console.error("Server Error:", e);
                res.writeHead(500);
                res.end();
            }
        });

        server.listen(0, () => {
            const address = server.address();
            if (typeof address === 'object' && address) {
                const port = address.port;
                console.log(`Asset server started on port ${port}`);
                resolve(port);
            } else {
                reject(new Error("Could not determine port"));
            }
        });
    });
}

let serverStarted = false;
async function ensureServer() {
    if (!serverStarted) {
        LOCAL_SERVER_PORT = await startStaticServer([process.cwd()]);
        serverStarted = true;
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

        // Fetch Subtitle Style if available
        const metadata = videoData.metadata as any;
        let subtitleClassName = "";
        let customSubtitleStyle: any = {};

        const styleId = metadata?.subtitleStyleId;
        let subtitleTemplateId: string | undefined = undefined;
        if (styleId) {
            const style = await db.query.subtitleStyle.findFirst({
                where: eq(subtitleStyle.id, styleId)
            });
            if (style) {
                console.log(`Using Subtitle Style: ${style.name}`);
                subtitleClassName = style.css || "";
                // Convert name to our slug format for standard CSS lookup
                subtitleTemplateId = style.name.toLowerCase().replace(/\s+/g, '-');
                // Backward compatibility if needed
                customSubtitleStyle = {
                    color: style.fontColor || 'white',
                    fontSize: style.fontSize || 50,
                    fontFamily: style.fontName || 'sans-serif',
                };
            }
        }

        // Read Script Data (for top-level subtitles and segments)
        let topLevelSubtitles: SubtitleSegment[] = [];
        let segments: VideoSegment[] = [];
        const baseWorkDir = process.env.VIDEO_WORK_DIR || path.join(process.cwd(), 'work_dir');
        const workDir = path.join(baseWorkDir, job.videoId);

        // Get script from script table
        const scriptData = await db.query.script.findFirst({
            where: eq(script.videoId, job.videoId)
        });

        if (!scriptData) {
            throw new Error(`Script not found for video ${job.videoId}`);
        }

        const scriptJson = scriptData.content as any;
        topLevelSubtitles = scriptJson.subtitles || [];
        segments = scriptJson.segments || [];


        // --- Static Server for Assets ---
        await ensureServer();

        // Helper to convert local paths to http://localhost URLs
        const toLocalUrl = (filePath: string) => {
            if (filePath.startsWith('http')) return filePath;

            let cleanPath = filePath;
            if (cleanPath.startsWith('file://')) {
                try {
                    cleanPath = fileURLToPath(cleanPath);
                } catch (e) {
                    cleanPath = cleanPath.replace('file://', '');
                }
            }

            // Make relative to cwd to construct URL
            // If path is absolute: /app/work_dir/x -> work_dir/x
            const relPath = path.isAbsolute(cleanPath)
                ? path.relative(process.cwd(), cleanPath)
                : cleanPath;

            return `http://localhost:${LOCAL_SERVER_PORT}/${relPath}`;
        };

        const inputProps: VideoRendererInput = {
            audioUrl: toLocalUrl(path.join(workDir, 'audio.wav')),
            subtitleClassName,
            subtitleStyle: customSubtitleStyle,
            subtitleLocation: metadata?.subtitleLocation || 'center',
            subtitleTemplateId,
            segments: segments.map(s => ({
                ...s,
                imageAssetPath: toLocalUrl(s.imageAssetPath)
            })),
            subtitles: topLevelSubtitles
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
            inputProps: inputProps as any,
        });

        // 4. Render
        console.log("Rendering...");
        console.log("Input Props being sent to render:", JSON.stringify(inputProps, null, 2));

        if (!fs.existsSync(workDir)) {
            fs.mkdirSync(workDir, { recursive: true });
        }

        const outputLocation = path.join(workDir, `${job.id}.mp4`);
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps: inputProps as any,
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
                    .where(
                        or(
                            eq(renderJob.status, 'VIDEO_QUEUED'),
                            eq(renderJob.status, 'AI_ASSET_GEN_COMPLETED')
                        )
                    )
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
