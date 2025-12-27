
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
        metadata: {
            templateId: 'simple'
        }
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
    process.exit(0);
}

insertJob().catch(console.error);
