import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateAudio, getAudioUrl } from "../services/editor-audio-service.js";
import { AppError } from "../lib/errors.js";

// Validation schemas
const generateAudioSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    script: z.string().min(1, "script is required"),
    voiceId: z.string().min(1, "voiceId is required"),
    tonePrompt: z.string().optional(),
});

export default async function editorAudioRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/editor/audio/generate
     * Generate TTS audio for a video
     */
    fastify.post("/generate", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = generateAudioSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId, script, voiceId, tonePrompt } = validation.data;

        try {
            const result = await generateAudio({
                videoId,
                userId,
                script,
                voiceId,
                tonePrompt,
            });

            return {
                success: true,
                audioKey: result.audioKey,
                audioUrl: result.audioUrl,
                durationSeconds: result.durationSeconds,
                subtitles: result.subtitles,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to generate audio" });
        }
    });

    /**
     * GET /api/editor/audio/:videoId
     * Get signed URL for audio playback
     */
    fastify.get("/:videoId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        try {
            const result = await getAudioUrl({ videoId, userId });

            if (!result) {
                return reply.status(404).send({ error: "No audio found for this video" });
            }

            return {
                success: true,
                audioUrl: result.audioUrl,
                durationSeconds: result.durationSeconds,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to get audio URL" });
        }
    });
}
