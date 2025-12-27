
import { db } from './src/db/index.js';
import { renderJob, script, video } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config();

// We need to import the internal function or simulate the worker start 
// But since the worker loop is infinite, we'll just insert a job and then run the command separately or mock the call.
// Actually, I can just write a script that inserts a SCRIPT_READY job and then I run `npm run start:ai` in the background.

async function setupTestJob() {
    console.log('Setting up test job for AI Asset Generator...');

    // 1. Find the video we created in step 2 (from previous manual run)
    // We search for videos with status SCRIPT_READY or modify the one we made.
    const videos = await db.select().from(video).where(eq(video.title, 'The Future of AI Agents')).limit(1);

    if (videos.length === 0) {
        console.error('Test video not found. Please run the script runner first or check DB.');
        process.exit(1);
    }

    const testVideo = videos[0];
    console.log(`Found video: ${testVideo.id}`);

    // Inject visual style
    const currentMeta = testVideo.metadata as any || {};
    await db.update(video)
        .set({
            metadata: { ...currentMeta, visualStyle: 'comic' },
            updatedAt: new Date()
        })
        .where(eq(video.id, testVideo.id));
    console.log("Injected visualStyle: 'comic' into metadata");

    // 2. Ensure it has a script entry
    const scripts = await db.select().from(script).where(eq(script.videoId, testVideo.id));
    if (scripts.length === 0) {
        console.error('Test video has no script. Cannot run AI Gen.');
        process.exit(1);
    }

    console.log(`Found script: ${scripts[0].id}`);

    // 3. Create or Update RenderJob
    // We want a job in 'SCRIPT_READY' state so the worker picks it up.

    // Check if job exists
    const jobs = await db.select().from(renderJob).where(eq(renderJob.videoId, testVideo.id));

    if (jobs.length > 0) {
        console.log(`Updating existing job ${jobs[0].id} to SCRIPT_READY`);
        await db.update(renderJob)
            .set({ status: 'SCRIPT_READY', workerId: null }) // clear worker to let it pick up
            .where(eq(renderJob.id, jobs[0].id));
    } else {
        const jobId = `job-${Math.random().toString(36).substring(7)}`;
        console.log(`Creating new job ${jobId}`);
        await db.insert(renderJob).values({
            id: jobId,
            videoId: testVideo.id,
            status: 'SCRIPT_READY'
        });
    }

    console.log('Job setup complete. Ready for worker.');
    process.exit(0);
}

setupTestJob().catch(console.error);
