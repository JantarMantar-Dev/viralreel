import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    analyzeVisuals,
    generateSegmentImage,
    generateAllImages,
    updateSegmentPrompt,
} from "../services/editor-visual-service.js";
import { AppError } from "../lib/errors.js";

// Validation schemas
const segmentInputSchema = z.object({
    index: z.number(),
    timeRange: z.tuple([z.number(), z.number()]),
    subtitleText: z.string(),
    id: z.string().optional(),
    imagePrompt: z.string().optional(),
});

const analyzeVisualsSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    segments: z.array(segmentInputSchema),
});

const generateSegmentSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    segmentId: z.string().min(1, "segmentId is required"),
    prompt: z.string().min(1, "prompt is required"),
    style: z.string().optional(),
});

const generateAllSchema = z.object({
    videoId: z.string().min(1, "videoId is required"),
    style: z.string().optional(),
});

const updatePromptSchema = z.object({
    prompt: z.string().min(1, "prompt is required"),
});

export default async function editorVisualsRoutes(fastify: FastifyInstance) {
    /**
     * POST /api/editor/visuals/analyze
     * Analyze script and generate visual segments
     */
    fastify.post("/analyze", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = analyzeVisualsSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId, segments } = validation.data;

        try {
            const result = await analyzeVisuals({
                videoId,
                userId,
                segments,
            });

            return {
                success: true,
                segments: result.segments,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to analyze visuals" });
        }
    });

    /**
     * POST /api/editor/visuals/generate-segment
     * Generate image for a single segment
     */
    fastify.post("/generate-segment", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = generateSegmentSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId, segmentId, prompt, style } = validation.data;

        try {
            const result = await generateSegmentImage({
                videoId,
                userId,
                segmentId,
                prompt,
                style,
            });

            return {
                success: true,
                segment: result.segment,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to generate segment image" });
        }
    });

    /**
     * POST /api/editor/visuals/generate-all
     * Generate images for all segments
     */
    fastify.post("/generate-all", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const validation = generateAllSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { videoId, style } = validation.data;

        try {
            const result = await generateAllImages({
                videoId,
                userId,
                style,
            });

            return {
                success: true,
                segments: result.segments,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to generate all images" });
        }
    });

    /**
     * PATCH /api/editor/visuals/segment/:segmentId
     * Update segment prompt without regenerating image
     */
    fastify.patch("/segment/:segmentId", async (request, reply) => {
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { segmentId } = request.params as { segmentId: string };
        const { videoId } = request.query as { videoId: string };

        if (!videoId) {
            return reply.status(400).send({ error: "videoId query parameter is required" });
        }

        const validation = updatePromptSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send({
                error: "Validation failed",
                details: validation.error.format()
            });
        }

        const { prompt } = validation.data;

        try {
            const result = await updateSegmentPrompt(videoId, userId, segmentId, prompt);

            return {
                success: true,
                segment: result.segment,
            };
        } catch (error: any) {
            fastify.log.error(error);
            if (error?.name === 'AppError') {
                return reply.status(error.statusCode).send({ key: error.key, message: error.message });
            }
            return reply.status(500).send({ error: error.message || "Failed to update segment prompt" });
        }
    });
}
