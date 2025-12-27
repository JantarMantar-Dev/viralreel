
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
            templateId: 'simple',
            inputProps: {
                audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                subtitleStyle: {
                    color: 'white',
                    fontSize: 50,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    fontFamily: 'Impact'
                },
                segments: [
                    {
                        // Default (Ken Burns)
                        image: "https://picsum.photos/id/237/1080/1920",
                        duration: 3,
                        subtitles: [{ text: "Default (Ken Burns)", start: 0, end: 90 }]
                    },
                    {
                        // Explicit Ken Burns
                        image: "https://picsum.photos/id/238/1080/1920",
                        duration: 3,
                        imageEffect: 'ken-burns',
                        subtitles: [{ text: "Explicit Ken Burns", start: 0, end: 90 }]
                    },
                    {
                        // Zoom In
                        image: "https://picsum.photos/id/239/1080/1920",
                        duration: 3,
                        imageEffect: 'zoom-in',
                        subtitles: [{ text: "Zoom In Effect", start: 0, end: 90 }]
                    },
                    {
                        // Shine
                        image: "https://picsum.photos/id/240/1080/1920",
                        duration: 3,
                        imageEffect: 'shine',
                        subtitles: [{ text: "Shine Effect", start: 0, end: 90 }]
                    },
                    {
                        // Grayscale
                        image: "https://picsum.photos/id/241/1080/1920",
                        duration: 3,
                        imageEffect: 'grayscale-to-color',
                        subtitles: [{ text: "Grayscale to Color", start: 0, end: 90 }]
                    },
                    {
                        // Tilt 3D
                        image: "https://picsum.photos/id/242/1080/1920",
                        duration: 3,
                        imageEffect: 'tilt-3d',
                        subtitles: [{ text: "3D Tilt", start: 0, end: 90 }]
                    }
                ]
            }
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
