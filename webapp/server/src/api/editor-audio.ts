import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateAudio, getAudioUrl, generateTranscription, saveTranscription } from "../services/editor-audio-service.js";
import { storageProvider } from "../lib/storage.js";
import { AppError } from "../lib/errors.js";

// Validation schemas
const generateAudioSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    script: z.string().min(1, "script is required"),
    voiceId: z.string().min(1, "voiceId is required"),
    tonePrompt: z.string().optional(),
});

const generateTranscriptionSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    audioId: z.string().min(1, "audioId is required"),
});

const saveTranscriptionSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    audioId: z.string().min(1, "audioId is required"),
    subtitles: z.array(z.object({
        text: z.string(),
        start: z.number(),
        end: z.number(),
    })),
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

            // Generate signed URLs for all audio versions
            const audioVersionsWithUrls = await Promise.all(
                result.audioVersions.map(async (v) => ({
                    ...v,
                    audioUrl: v.audioKey === result.audioKey 
                        ? result.audioUrl 
                        : await storageProvider.getSignedUrl(v.audioKey),
                }))
            );

            return {
                success: true,
                audioId: result.audioId,
                audioKey: result.audioKey,
                audioUrl: result.audioUrl,
                durationSeconds: result.durationSeconds,
                voiceId: result.voiceId,
                voiceName: result.voiceName,
                tonePrompt: result.tonePrompt,
                generatedAt: result.generatedAt,
                audioVersions: audioVersionsWithUrls,
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

    /**
     * POST /api/editor/audio/transcribe
     * Generate transcription for a specific audio version
     * This is a separate step from audio generation for better control
     */
    fastify.post("/transcribe", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = generateTranscriptionSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId, audioId } = validation.data;

        try {
            const result = await generateTranscription({
                videoId,
                userId,
                audioId,
            });

            return {
                success: true,
                audioId: result.audioId,
                subtitles: result.subtitles,
                wordCount: result.wordCount,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ 
                    key: error.key, 
                    message: error.message 
                });
            }
            return reply.status(500).send({ 
                error: error.message || "Failed to generate transcription" 
            });
        }
    });

    /**
     * POST /api/editor/audio/save-transcription
     * Save edited transcription for a specific audio version
     */
    fastify.post("/save-transcription", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = saveTranscriptionSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId, audioId, subtitles } = validation.data;

        try {
            const result = await saveTranscription({
                videoId,
                userId,
                audioId,
                subtitles,
            });

            return {
                success: true,
                audioId: result.audioId,
                wordCount: result.wordCount,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ 
                    key: error.key, 
                    message: error.message 
                });
            }
            return reply.status(500).send({ 
                error: error.message || "Failed to save transcription" 
            });
        }
    });
}
