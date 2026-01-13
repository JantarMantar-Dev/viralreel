import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateScriptOnly, estimateStoryDuration } from "../scripting/script-generator.js";

const generateScriptSchema = z.object({
    scriptIdea: z.string().min(1, "Script idea is required"),
    nicheName: z.string().optional(),
    duration: z.number().min(0.5).max(5).default(1),
    voiceId: z.string().optional().default("Zephyr"),
});

export type GenerateScriptBody = z.infer<typeof generateScriptSchema>;

export default async function scriptingRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/scripting/generate
     * Generate a script preview for editor mode
     * This doesn't create a job - just generates script content for preview
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

            return {
                success: true,
                script: {
                    story: result.story,
                    wordCount,
                    estimatedDurationSeconds: estimatedSeconds,
                }
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
     */
    fastify.post("/regenerate", async (request, reply) => {
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
            console.log(`[ScriptingRoute] Regenerating script for user ${userId}`);

            const result = await generateScriptOnly({
                scriptIdea: body.scriptIdea,
                nicheName: body.nicheName,
                duration: body.duration,
                voiceId: body.voiceId || "Zephyr",
            });

            const { wordCount, estimatedSeconds } = estimateStoryDuration(result.story);

            return {
                success: true,
                script: {
                    story: result.story,
                    wordCount,
                    estimatedDurationSeconds: estimatedSeconds,
                }
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: error.message || "Failed to regenerate script"
            });
        }
    });
}
