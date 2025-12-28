import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { contentNiche } from "../db/schema.js";
import { and, eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";

// --- Validation Schemas ---

const createNicheSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().or(z.null()),
    iconUrl: z.string().url().optional().or(z.literal("")).or(z.null()),
    iconName: z.string().optional().or(z.null()),
    tags: z.string().optional().or(z.null()),
    scriptPrompt: z.string().optional().or(z.null()),
    videoPrompt: z.string().optional().or(z.null()),
});

const updateNicheSchema = createNicheSchema.partial();

export default async function nicheRoutes(fastify: FastifyInstance) {
    // GET /api/niches - Fetch all niches (admin + user's own)
    fastify.get("/", async (request, reply) => {
        try {
            const userId = request.user?.id;

            const niches = await db.select()
                .from(contentNiche)
                .where(
                    userId
                        ? or(eq(contentNiche.userId, "admin"), eq(contentNiche.userId, userId))
                        : eq(contentNiche.userId, "admin")
                );
            return niches;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch niches" });
        }
    });

    // GET /api/niches/check-name - Check if a niche name is available for the user
    fastify.get("/check-name", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const { name } = request.query as { name: string };
            if (!name) return { isAvailable: true };

            const existing = await db.select()
                .from(contentNiche)
                .where(
                    and(
                        eq(contentNiche.userId, request.user.id),
                        eq(contentNiche.name, name.trim())
                    )
                )
                .limit(1);

            return { isAvailable: existing.length === 0 };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to check niche name" });
        }
    });

    // POST /api/niches - Create a new niche
    fastify.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const validation = createNicheSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    error: "Validation failed",
                    details: validation.error.format()
                });
            }

            const body = validation.data;

            // Check for duplicate name for this user
            const existing = await db.select()
                .from(contentNiche)
                .where(
                    and(
                        eq(contentNiche.userId, request.user.id),
                        eq(contentNiche.name, body.name.trim())
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                return reply.status(409).send({ error: "A niche with this name already exists in your account." });
            }

            const newNiche = {
                id: randomUUID(),
                name: body.name.trim(),
                userId: request.user.id,
                description: body.description || null,
                iconUrl: body.iconUrl || null,
                iconName: body.iconName || "HelpCircle", // Default icon for user-created niches
                tags: body.tags || null,
                scriptPrompt: body.scriptPrompt || null,
                videoPrompt: body.videoPrompt || null,
            };

            await db.insert(contentNiche).values(newNiche);
            return reply.status(201).send(newNiche);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to create niche" });
        }
    });

    // PUT /api/niches/:id - Update an existing niche
    fastify.put("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const validation = updateNicheSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    error: "Validation failed",
                    details: validation.error.format()
                });
            }

            const body = validation.data;
            const updatedNiche: any = {
                ...body,
                updatedAt: new Date(),
            };

            await db.update(contentNiche)
                .set(updatedNiche)
                .where(eq(contentNiche.id, id));

            return { id, ...updatedNiche };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to update niche" });
        }
    });

    // DELETE /api/niches/:id - Remove a niche
    fastify.delete("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            await db.delete(contentNiche).where(eq(contentNiche.id, id));
            return reply.status(204).send();
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to delete niche" });
        }
    });
}
