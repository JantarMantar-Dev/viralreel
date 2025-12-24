import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { series, video, renderJob, contentNiche, script } from "../db/schema.js";
import { eq, desc, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createVideoJob } from "../services/video-service.js";

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
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch jobs" });
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
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to create job" });
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

        // We reuse the same schema validation, but we can relax seriesName since we have the ID
        // However, for simplicity, frontend can just send the seriesName (it has it in context)
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
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to add episode" });
        }
    });
}
