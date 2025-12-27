
import { db } from './src/db/index.js';
import { renderJob, video, user } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function testPipeline() {
    console.log("Starting Multi-Worker Pipeline Test...");

    // 1. Get or Create User
    let testUser = await db.query.user.findFirst();
    if (!testUser) {
        const userId = nanoid();
        await db.insert(user).values({
            id: userId,
            name: "Test User",
            email: "test_multi@example.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        testUser = { id: userId } as any;
    }

    // 2. Create Video
    const videoId = nanoid();
    await db.insert(video).values({
        id: videoId,
        userId: testUser!.id,
        title: "Multi-Worker Pipeline Test",
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { templateId: 'simple', inputProps: { segments: [] } }
    });

    // 3. Start the process by creating a QUEUED job
    const jobId = nanoid();
    await db.insert(renderJob).values({
        id: jobId,
        videoId: videoId,
        status: "QUEUED",
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log(`Job ${jobId} inserted with status: QUEUED`);
    console.log("Now start the workers:");
    console.log("1. npm run start:script");
    console.log("2. npm run start:ai");
    console.log("3. npm run start:video");
    console.log("\nObserve the job status transition in the DB.");

    // In a real test we'd poll here, but for now we'll just exit.
    process.exit(0);
}

testPipeline().catch(console.error);
