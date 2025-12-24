import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { series, video, renderJob, contentNiche, script } from "../db/schema.js";
import { eq, desc, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const baseJobSchema = z.object({
    nicheId: z.string().nullable(),
    scriptIdea: z.string().min(1, "Script idea is required"),
    duration: z.number().min(0.5, "Duration must be at least 30 seconds"),
    segments: z.number().int().min(1, "At least 1 segment is required"),
    visualFormat: z.enum(["image", "video"]),
    voiceId: z.string().optional(),
    visualStyle: z.string().optional(),
    subtitleTemplateId: z.string().optional(),
    musicId: z.string().optional(),
    isDraft: z.boolean(),
});

const createJobSchema = z.discriminatedUnion("jobType", [
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

type CreateJobBody = z.infer<typeof createJobSchema>;

export default async function jobRoutes(fastify: FastifyInstance) {
    // GET /api/jobs - List all jobs (Series and Single Videos)
    fastify.get("/", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        try {
            // Fetch all series
            const userSeries = await db.select()
                .from(series)
                .where(eq(series.userId, userId))
                .orderBy(desc(series.createdAt));

            // Fetch all standalone videos (not part of a series)
            const singleVideos = await db.select()
                .from(video)
                .where(and(
                    eq(video.userId, userId),
                    isNull(video.seriesId)
                ))
                .orderBy(desc(video.createdAt));

            return {
                series: userSeries,
                videos: singleVideos
            };
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
            // Common metadata for all videos in this request
            const metadata = {
                duration: body.duration,
                segments: body.segments,
                visualFormat: body.visualFormat,
                visualStyle: body.visualStyle,
                voiceId: body.voiceId,
                subtitleTemplateId: body.subtitleTemplateId,
                musicId: body.musicId,
                scriptIdea: body.scriptIdea,
                nicheId: body.nicheId ?? undefined,
            };

            let seriesId: string | null = null;
            const createdVideos = [];

            // 1. Create Series if requested
            if (body.jobType === "series") {
                seriesId = nanoid();
                await db.insert(series).values({
                    id: seriesId,
                    userId,
                    nicheId: body.nicheId || null,
                    name: body.seriesName,
                    description: body.scriptIdea
                });
            }

            // 2. Determine number of episodes
            const episodeCount = body.jobType === "series" ? (body.segments || 3) : 1;

            // 3. Create Video entries
            for (let i = 1; i <= episodeCount; i++) {
                const videoId = nanoid();

                // Determine title
                let title = "Untitled Video";
                if (body.jobType === "series") {
                    if (i === 1) {
                        title = body.episodeTitle;
                    } else {
                        title = `${body.seriesName} - Episode ${i}`;
                    }
                } else {
                    title = body.episodeTitle;
                }

                await db.insert(video).values({
                    id: videoId,
                    userId,
                    seriesId,
                    nicheId: body.nicheId || null,
                    title,
                    episodeNumber: i,
                    status: isDraft ? "DRAFT" : "SCRIPTING", // Initial status
                    metadata: metadata
                });

                createdVideos.push(videoId);

                // 4. Create Render Job if NOT a draft
                if (!isDraft) {
                    await db.insert(renderJob).values({
                        id: nanoid(),
                        videoId,
                        status: "QUEUED",
                        progress: 0
                    });
                }
            }

            return {
                success: true,
                message: "Job created successfully",
                seriesId,
                videoIds: createdVideos
            };

        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to create job" });
        }
    });
}
