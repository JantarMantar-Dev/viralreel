
import { db } from './src/db/index.js';
import { script, video } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function clearScriptAssets(videoTitle: string) {
    console.log(`Clearing assets for video: ${videoTitle}`);

    // 1. Get video
    const videos = await db.select().from(video).where(eq(video.title, videoTitle)).limit(1);
    if (videos.length === 0) {
        console.error("Video not found");
        process.exit(1);
    }
    const testVideo = videos[0];

    // 2. Get script
    const scripts = await db.select().from(script).where(eq(script.videoId, testVideo.id)).limit(1);
    if (scripts.length === 0) {
        console.error("Script not found");
        process.exit(1);
    }
    const currentScript = scripts[0];
    const content = currentScript.content as any;

    if (content && content.segments) {
        // Clear imageAssetPath
        const updatedSegments = content.segments.map((s: any) => {
            const { imageAssetPath, ...rest } = s;
            return rest;
        });

        // Update DB
        await db.update(script)
            .set({
                content: { ...content, segments: updatedSegments },
                updatedAt: new Date()
            })
            .where(eq(script.id, currentScript.id));

        console.log("Cleared imageAssetPath from script segments.");
    }

    process.exit(0);
}

clearScriptAssets('The Future of AI Agents').catch(console.error);
