import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateScriptOnly, estimateStoryDuration } from "../scripting/script-generator.js";
import { db } from "../db/index.js";
import { video } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

interface ScriptVersion {
    id: string;
    story: string;
    wordCount: number;
    estimatedDurationSeconds: number;
    feedback?: string;
    generatedAt: string;
}

const generateScriptSchema = z.object({
    scriptIdea: z.string().min(1, "Script idea is required"),
    nicheName: z.string().optional(),
    duration: z.number().min(0.5).max(5).default(1),
    voiceId: z.string().optional().default("Zephyr"),
    videoId: z.string().optional(), // Optional: if provided, save script to video metadata
});

const regenerateScriptSchema = generateScriptSchema.extend({
    feedback: z.string().optional(),
    previousScript: z.string().optional(),
});

export type GenerateScriptBody = z.infer<typeof generateScriptSchema>;

export default async function scriptingRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/scripting/generate
     * Generate a script preview for editor mode
     * If videoId is provided, also saves the script to the video's metadata
     */
    fastify.post("/generate", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = generateScriptSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const body = validation.data;

        try {
            console.log(`[ScriptingRoute] Generating script for user ${userId}`);

            const result = await generateScriptOnly({
                scriptIdea: body.scriptIdea,
                nicheName: body.nicheName,
                duration: body.duration,
                voiceId: body.voiceId || "Zephyr",
            });

            const { wordCount, estimatedSeconds } = estimateStoryDuration(result.story);

            const scriptData = {
                story: result.story,
                wordCount,
                estimatedDurationSeconds: estimatedSeconds,
            };

            // If videoId provided, save to video metadata
            if (body.videoId) {
                await saveScriptToVideo(body.videoId, userId, scriptData);
            }

            return {
                success: true,
                script: scriptData
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to generate script"
            });
        }
    });

    /**
     * POST /api/scripting/regenerate
     * Regenerate a script with the same or modified parameters
     * If videoId is provided, saves the script version to metadata
     */
    fastify.post("/regenerate", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = regenerateScriptSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const body = validation.data;

        try {
            console.log(`[ScriptingRoute] Regenerating script for user ${userId}${body.feedback ? ' with feedback' : ''}`);

            const result = await generateScriptOnly({
                scriptIdea: body.scriptIdea,
                nicheName: body.nicheName,
                duration: body.duration,
                voiceId: body.voiceId || "Zephyr",
                feedback: body.feedback,
                previousScript: body.previousScript,
            });

            const { wordCount, estimatedSeconds } = estimateStoryDuration(result.story);

            const scriptData = {
                story: result.story,
                wordCount,
                estimatedDurationSeconds: estimatedSeconds,
            };

            // If videoId provided, save to video metadata with version tracking
            if (body.videoId) {
                await saveScriptToVideo(body.videoId, userId, scriptData, body.feedback);
            }

            return {
                success: true,
                script: scriptData
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to regenerate script"
            });
        }
    });
}

/**
 * Helper function to save script to video metadata
 * Also tracks script versions for history
 */
async function saveScriptToVideo(
    videoId: string,
    userId: string,
    scriptData: { story: string; wordCount: number; estimatedDurationSeconds: number },
    feedback?: string
): Promise<void> {
    // Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        console.warn(`[ScriptingRoute] Video ${videoId} not found for user ${userId}, skipping save`);
        return;
    }

    const currentMetadata = (existingVideo[0].metadata as any) || {};
    
    // Create a new script version entry
    const newVersion: ScriptVersion = {
        id: crypto.randomUUID(),
        story: scriptData.story,
        wordCount: scriptData.wordCount,
        estimatedDurationSeconds: scriptData.estimatedDurationSeconds,
        feedback,
        generatedAt: new Date().toISOString(),
    };

    // Get existing versions or initialize empty array
    const existingVersions: ScriptVersion[] = currentMetadata.scriptVersions || [];
    const updatedVersions = [...existingVersions, newVersion];

    // Update metadata
    const updatedMetadata = {
        ...currentMetadata,
        generatedScript: scriptData, // Current/selected script
        scriptVersions: updatedVersions, // All versions for history
        scriptGenerationCount: updatedVersions.length,
        lastScriptGeneratedAt: new Date().toISOString(),
    };

    await db.update(video)
        .set({
            metadata: updatedMetadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    console.log(`[ScriptingRoute] Saved script version ${updatedVersions.length} to video ${videoId}`);
}
