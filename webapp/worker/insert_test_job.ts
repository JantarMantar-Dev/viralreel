
import { db } from './src/db';
import { renderJob, video, user } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function insertJob() {
    console.log("Inserting test job...");

    // 1. Get or Create User
    let testUser = await db.query.user.findFirst();
    if (!testUser) {
        const userId = nanoid();
        await db.insert(user).values({
            id: userId,
            name: "Test User",
            email: "test@example.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        testUser = { id: userId } as any;
        console.log("Created test user", userId);
    } else {
        console.log("Using existing user", testUser.id);
    }

    // 2. Create Video
    const videoId = nanoid();
    await db.insert(video).values({
        id: videoId,
        userId: testUser!.id,
        title: "Remotion Worker Test Video",
        status: "Script Ready",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
    });
    console.log("Created video", videoId);

    // 3. Create Render Job
    const jobId = nanoid();
    await db.insert(renderJob).values({
        id: jobId,
        videoId: videoId,
        status: "QUEUED",
        createdAt: new Date(),
        updatedAt: new Date()
    });
    console.log("Created render job", jobId);

    // 4. Poll for completion
    console.log("Waiting for job completion...");
    let attempts = 0;
    while (true) {
        const job = await db.query.renderJob.findFirst({
            where: eq(renderJob.id, jobId)
        });

        if (!job) {
            console.error("Job disappeared!");
            process.exit(1);
        }

        console.log(`Status: ${job.status} (Progress: ${job.progress}%)`);

        if (job.status === 'COMPLETED') {
            console.log("\nJob Completed Successfully!");
            // console.log("Output URL:", job.outputUrl); // Schema check needed if we added it back to renderJob, but it's on video usually.

            // Check video table for output
            const vid = await db.query.video.findFirst({ where: eq(video.id, videoId) });
            console.log("Video Output URL:", vid?.outputUrl);

            break;
        } else if (job.status === 'FAILED') {
            console.error("\nJob Failed:", job.error);
            process.exit(1);
        }

        attempts++;
        if (attempts > 60) { // 2 minutes timeout (assuming 2s interval)
            console.error("\nTimeout waiting for job completion");
            process.exit(1);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    process.exit(0);
}

insertJob().catch(console.error);
