import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { series, video, renderJob } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { createEditorJobSchema, CreateEditorJobBody, VideoMetadata } from "./schemas/job-schemas.js";
import { createEditorVideoJob } from "../services/editor-video-service.js";
import { AppError } from "../lib/errors.js";

export default async function editorJobRoutes(fastify: FastifyInstance) {
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
