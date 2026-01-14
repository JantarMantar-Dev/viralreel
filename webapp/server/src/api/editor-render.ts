import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import { video, renderJob } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { deductCredits, hasEnoughCredits } from "../services/credit-service.js";
import { AppError } from "../lib/errors.js";
import { v4 as uuidv4 } from "uuid";

// Validation schemas
const submitRenderSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
});

export default async function editorRenderRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/editor/render
     * Submit video for final render
     */
    fastify.post("/", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = submitRenderSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId } = validation.data;

        try {
            // 1. Verify video belongs to user
            const existingVideo = await db.select()
                .from(video)
                .where(and(eq(video.id, videoId), eq(video.userId, userId)))
                .limit(1);

            if (existingVideo.length === 0) {
                throw new AppError("NotFound", "Video not found or access denied", 404);
            }

            const currentVideo = existingVideo[0];
            const metadata = currentVideo.metadata as any;

            // 2. Validate all phases are complete
            if (!metadata?.approvedScript && !metadata?.editorMode) {
                throw new AppError("BadRequest", "Script not approved", 400);
            }

            // Check for audio (optional but recommended)
            if (!metadata?.audioKey) {
                fastify.log.warn(`[EditorRender] Video ${videoId} submitted without audio`);
            }

            // Check for segments (optional but recommended)
            if (!metadata?.segments || metadata.segments.length === 0) {
                fastify.log.warn(`[EditorRender] Video ${videoId} submitted without visual segments`);
            }

            // 3. Check credits
            const canAfford = await hasEnoughCredits(userId, 1);
            if (!canAfford) {
                throw new AppError("InsuffCredits", "Insufficient credits to render this video", 402);
            }

            // 4. Deduct credits
            await deductCredits(userId, 1, videoId, undefined, "Video render - Editor Mode");

            // 5. Update video status
            await db.update(video)
                .set({
                    status: "GENERATING",
                    mode: "editor",
                    metadata: {
                        ...metadata,
                        currentPhase: "render",
                        submittedForRenderAt: new Date().toISOString(),
                    },
                    updatedAt: new Date()
                })
                .where(eq(video.id, videoId));

            // 6. Create or update render job
            const existingJob = await db.select()
                .from(renderJob)
                .where(eq(renderJob.videoId, videoId))
                .limit(1);

            const renderJobId = existingJob.length > 0 ? existingJob[0].id : uuidv4();

            if (existingJob.length > 0) {
                // Update existing job
                await db.update(renderJob)
                    .set({
                        status: "VIDEO_QUEUED",
                        progress: 0,
                        error: null,
                        retryCount: 0,
                        startedAt: null,
                        completedAt: null,
                        updatedAt: new Date()
                    })
                    .where(eq(renderJob.id, renderJobId));
            } else {
                // Create new job
                await db.insert(renderJob)
                    .values({
                        id: renderJobId,
                        videoId,
                        status: "VIDEO_QUEUED",
                        progress: 0,
                        metadata: {
                            mode: "editor",
                            submittedAt: new Date().toISOString(),
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
            }

            fastify.log.info(`[EditorRender] Render job ${renderJobId} created for video ${videoId}`);

            return {
                success: true,
                videoId,
                renderJobId,
                status: "VIDEO_QUEUED",
                message: "Video submitted for rendering"
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to submit render" });
        }
    });

    /**
     * GET /api/editor/render/:videoId/status
     * Get render job status
     */
    fastify.get("/:videoId/status", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { videoId } = request.params as { videoId: string };

        try {
            // Verify video belongs to user
            const existingVideo = await db.select()
                .from(video)
                .where(and(eq(video.id, videoId), eq(video.userId, userId)))
                .limit(1);

            if (existingVideo.length === 0) {
                throw new AppError("NotFound", "Video not found or access denied", 404);
            }

            // Get render job
            const job = await db.select()
                .from(renderJob)
                .where(eq(renderJob.videoId, videoId))
                .limit(1);

            if (job.length === 0) {
                return {
                    success: true,
                    status: "NOT_SUBMITTED",
                    progress: 0,
                };
            }

            return {
                success: true,
                status: job[0].status,
                progress: job[0].progress || 0,
                error: job[0].error,
                outputUrl: existingVideo[0].outputUrl,
                compressedUrl: existingVideo[0].compressedUrl,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to get render status" });
        }
    });
}
