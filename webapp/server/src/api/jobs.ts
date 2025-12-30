import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { series, video, renderJob, contentNiche, script } from "../db/schema.js";
import { eq, desc, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createVideoJob, deleteVideo, queueVideoRender, updateVideoMetadata } from "../services/video-service.js";
import { storageProvider } from "../lib/storage.js";

export const baseJobSchema = z.object({
    nicheId: z.string().nullable(),
    scriptIdea: z.string().min(1, "Script idea is required"),
    duration: z.number().min(0.5, "Duration must be at least 30 seconds"),
    segments: z.number().int().min(1, "At least 1 segment is required"),
    visualFormat: z.enum(["image", "video"]),
    voiceId: z.string().optional(),
    visualStyle: z.string().optional(),
    subtitleTemplateId: z.string().optional(),
    musicId: z.string().optional(),
    aspectRatio: z.enum(["portrait", "landscape"]).default("portrait"),
    isDraft: z.boolean().default(false),
});

export const createJobSchema = z.discriminatedUnion("jobType", [
    baseJobSchema.extend({
        jobType: z.literal("series"),
        seriesName: z.string().min(1, "Series name is required"),
        episodeTitle: z.string().min(1, "Episode title is required"),
    }),
    baseJobSchema.extend({
        jobType: z.literal("video"),
        seriesName: z.string().optional(),
        episodeTitle: z.string().min(1, "Video title is required"),
    }),
]);

export type CreateJobBody = z.infer<typeof createJobSchema>;

export default async function jobRoutes(fastify: FastifyInstance) {
    // GET /api/jobs - List all active render jobs
    fastify.get("/", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        try {
            // Query render_job joined with video and series
            const jobs = await db.select({
                jobId: renderJob.id,
                status: renderJob.status,
                progress: renderJob.progress,
                createdAt: renderJob.createdAt,
                videoId: video.id,
                title: video.title,
                metadata: video.metadata,
                seriesId: series.id,
                seriesName: series.name,
            })
                .from(renderJob)
                .innerJoin(video, eq(renderJob.videoId, video.id))
                .leftJoin(series, eq(video.seriesId, series.id))
                .where(eq(video.userId, userId))
                .orderBy(desc(renderJob.createdAt));

            return { jobs };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message || "Failed to fetch jobs" });
        }
    });

    // GET /api/jobs/:videoId - Get details for a specific video
    fastify.get("/:videoId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        try {
            const videoData = await db.select({
                id: video.id,
                title: video.title,
                status: video.status,
                metadata: video.metadata,
                seriesId: video.seriesId,
                seriesName: series.name,
                nicheId: video.nicheId,
                renderStatus: renderJob.status,
                outputUrl: video.outputUrl,
                compressedUrl: video.compressedUrl
            })
                .from(video)
                .leftJoin(renderJob, eq(video.id, renderJob.videoId))
                .leftJoin(series, eq(video.seriesId, series.id))
                .where(and(eq(video.id, videoId), eq(video.userId, userId)))
                .limit(1);

            if (videoData.length === 0) {
                return reply.status(404).send({ error: "Video not found" });
            }

            const v = videoData[0];
            const signedOutputUrl = await storageProvider.getSignedUrlFromFullUrl(v.outputUrl || "");
            const signedCompressedUrl = await storageProvider.getSignedUrlFromFullUrl(v.compressedUrl || "");

            return {
                success: true,
                video: {
                    ...v,
                    outputUrl: signedOutputUrl,
                    compressedUrl: signedCompressedUrl
                }
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message || "Failed to fetch video details" });
        }
    });

    // POST /api/jobs - Create a new video job
    fastify.post("/", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = createJobSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const body = validation.data;
        const isDraft = body.isDraft || false;

        try {
            const result = await createVideoJob({
                userId,
                body,
                isDraft
            });

            return result;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message || "Failed to create job" });
        }
    });

    // POST /api/jobs/:videoId/render - Trigger rendering for a draft video
    fastify.post("/:videoId/render", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        try {
            const result = await queueVideoRender(videoId, userId);
            return result;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(error.message.includes("not found") ? 404 : 500).send({ error: error.message });
        }
    });

    // POST /api/jobs/:videoId/retry - Retry processing if URL is missing
    fastify.post("/:videoId/retry", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        request.log.info(`[RETRY] Request to retry video ${videoId}. we will process request.`);

        return { success: true, message: "Retry request processed" };
    });

    // PATCH /api/jobs/:videoId - Update metadata (Edit)
    fastify.patch("/:videoId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };
        const validation = createJobSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        try {
            const result = await updateVideoMetadata(videoId, userId, validation.data);
            return result;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(error.message.includes("not found") ? 404 : 500).send({ error: error.message });
        }
    });

    // DELETE /api/jobs/:videoId - Delete a video
    fastify.delete("/:videoId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        try {
            const result = await deleteVideo(videoId, userId);
            return result;
        } catch (error: any) {
            fastify.log.error(error);
            const status = error.message.includes("not found") ? 404 : 400;
            return reply.status(status).send({ error: error.message });
        }
    });

    // POST /api/jobs/series/:seriesId/episode - Add an episode to an existing series
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

        const validation = createJobSchema.safeParse(request.body);

        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const body = validation.data;
        const isDraft = body.isDraft || false;

        try {
            const result = await createVideoJob({
                userId,
                body,
                existingSeriesId: seriesId,
                isDraft
            });

            return result;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message || "Failed to add episode" });
        }
    });
}
