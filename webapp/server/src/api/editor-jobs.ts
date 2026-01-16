import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { series, video, renderJob } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createEditorJobSchema, CreateEditorJobBody, VideoMetadata } from "./schemas/job-schemas.js";
import { createEditorVideoJob, createEditorDraftVideo } from "../services/editor-video-service.js";
import { AppError } from "../lib/errors.js";
import { storageProvider } from "../lib/storage.js";

// Schema for creating a draft video (minimal info to get started)
const createDraftSchema = z.object({
    nicheId: z.string().nullable(),
    nicheName: z.string().optional(),
    episodeTitle: z.string().optional().default(""),
    scriptIdea: z.string().optional().default(""),
    duration: z.number().optional().default(0.5),
    visualStyle: z.string().optional().default("comic"),
    approvedScript: z.object({
        story: z.string().min(1),
        wordCount: z.number(),
        estimatedDurationSeconds: z.number(),
    }),
});

// Schema for auto-save metadata updates (flexible partial update)
const autoSaveSchema = z.object({
    currentPhase: z.enum(["script", "audio", "visuals", "subtitles", "review"]).optional(),
    episodeTitle: z.string().optional(),
    scriptIdea: z.string().optional(),
    duration: z.number().optional(),
    visualStyle: z.string().optional(),
    voiceId: z.string().optional(),
    voiceName: z.string().optional(),
    tonePrompt: z.string().optional(),
    subtitleStyleId: z.string().optional(),
    subtitleStyleName: z.string().optional(),
    musicId: z.string().optional(),
    musicName: z.string().optional(),
    selectedAudioId: z.string().optional(),
    // These are stored but not directly editable via auto-save
    // approvedScript, audioKey, segments are managed by dedicated endpoints
});

export default async function editorJobRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/editor-jobs/:videoId
     * Get an existing editor mode video with all metadata
     */
    fastify.get("/:videoId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        try {
            const existingVideo = await db.select()
                .from(video)
                .where(and(eq(video.id, videoId), eq(video.userId, userId)))
                .limit(1);

            if (existingVideo.length === 0) {
                return reply.status(404).send({ error: "Video not found" });
            }

            const v = existingVideo[0];
            const metadata = v.metadata as any || {};

            // Generate signed URLs for audio if available
            let audioUrl: string | undefined;
            if (metadata.audioKey) {
                audioUrl = await storageProvider.getSignedUrl(metadata.audioKey, 3 * 60 * 60);
            }

            // Generate signed URLs for segment images
            const segments = metadata.segments || [];
            const segmentsWithUrls = await Promise.all(
                segments.map(async (seg: any) => {
                    if (seg.imageKey) {
                        const imageUrl = await storageProvider.getSignedUrl(seg.imageKey, 3 * 60 * 60);
                        return { ...seg, imageUrl };
                    }
                    return seg;
                })
            );

            return {
                success: true,
                video: {
                    id: v.id,
                    title: v.title,
                    status: v.status,
                    mode: v.mode,
                    nicheId: v.nicheId,
                    createdAt: v.createdAt,
                    updatedAt: v.updatedAt,
                    // Flatten metadata for client consumption
                    currentPhase: metadata.currentPhase || "script",
                    scriptIdea: metadata.scriptIdea,
                    approvedScript: metadata.generatedScript,
                    scriptGenerationCount: metadata.scriptGenerationCount || 0,
                    voiceId: metadata.voiceId,
                    tonePrompt: metadata.tonePrompt,
                    audioKey: metadata.audioKey,
                    audioUrl,
                    audioDurationSeconds: metadata.audioDurationSeconds,
                    audioGenerationCount: metadata.audioGenerationCount || 0,
                    audioVersions: metadata.audioVersions || [],
                    selectedAudioId: metadata.selectedAudioId,
                    subtitles: metadata.subtitles,
                    scriptSegments: metadata.scriptSegments,
                    visualStyle: metadata.visualStyle,
                    segments: segmentsWithUrls,
                    subtitleStyleId: metadata.subtitleStyleId,
                    subtitleStyleName: metadata.subtitleStyleName,
                    musicId: metadata.musicId,
                    musicName: metadata.musicName,
                    aspectRatio: metadata.aspectRatio || "portrait",
                    duration: metadata.duration,
                },
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message || "Failed to get video" });
        }
    });

    /**
     * PATCH /api/editor-jobs/:videoId/metadata
     * Auto-save partial metadata updates (lightweight endpoint for frequent saves)
     */
    fastify.patch("/:videoId/metadata", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };
        const validation = autoSaveSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        try {
            const existingVideo = await db.select()
                .from(video)
                .where(and(eq(video.id, videoId), eq(video.userId, userId)))
                .limit(1);

            if (existingVideo.length === 0) {
                return reply.status(404).send({ error: "Video not found" });
            }

            const currentMetadata = existingVideo[0].metadata as any || {};
            const updates = validation.data;

            // Merge updates into metadata
            const newMetadata = {
                ...currentMetadata,
                ...updates,
                editorMode: true,
            };

            // Update video title if provided
            const newTitle = updates.episodeTitle || existingVideo[0].title;

            await db.update(video)
                .set({
                    title: newTitle,
                    metadata: newMetadata,
                    updatedAt: new Date()
                })
                .where(eq(video.id, videoId));

            return {
                success: true,
                message: "Metadata updated",
                updatedAt: new Date().toISOString(),
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message || "Failed to update metadata" });
        }
    });

    /**
     * POST /api/editor-jobs/draft
     * Create a draft video to get a videoId for the editor workflow
     * This is called when the user approves the script
     */
    fastify.post("/draft", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = createDraftSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        try {
            const result = await createEditorDraftVideo({
                userId,
                ...validation.data,
            });

            return {
                success: true,
                videoId: result.videoId,
                message: "Draft video created",
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to create draft video" });
        }
    });

    /**
     * POST /api/editor-jobs
     * Create a new video job using editor mode (with pre-generated script)
     */
    fastify.post("/", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = createEditorJobSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const body = validation.data;
        const isDraft = body.isDraft || false;

        try {
            const result = await createEditorVideoJob({
                userId,
                body,
                isDraft
            });

            return result;
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to create editor job" });
        }
    });

    /**
     * POST /api/editor-jobs/series/:seriesId/episode
     * Add an episode to an existing series using editor mode
     */
    fastify.post("/series/:seriesId/episode", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { seriesId } = request.params as { seriesId: string };

        // Validate that the series exists and belongs to the user
        const existingSeries = await db.select()
            .from(series)
            .where(and(eq(series.id, seriesId), eq(series.userId, userId)))
            .limit(1);

        if (existingSeries.length === 0) {
            return reply.status(404).send({ error: "Series not found" });
        }

        const validation = createEditorJobSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const body = validation.data;
        const isDraft = body.isDraft || false;

        try {
            const result = await createEditorVideoJob({
                userId,
                body,
                existingSeriesId: seriesId,
                isDraft
            });

            return result;
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to add episode" });
        }
    });

    /**
     * PATCH /api/editor-jobs/:videoId
     * Update an existing editor mode video (draft or failed)
     */
    fastify.patch("/:videoId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };
        const validation = createEditorJobSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        try {
            const { updateEditorVideoMetadata } = await import("../services/editor-video-service.js");
            const result = await updateEditorVideoMetadata(videoId, userId, validation.data);
            return result;
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(error.message.includes("not found") ? 404 : 500).send({ error: error.message });
        }
    });
}
