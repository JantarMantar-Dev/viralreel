import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { musicTrack } from "../db/schema.js";
import { eq, or, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { storageProvider } from "../lib/storage.js";
import { parseBuffer } from "music-metadata";

// --- Validation Schemas ---

const musicResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    durationSeconds: z.number().nullable(),
    createdAt: z.date().nullable(),
});

export default async function musicRoutes(fastify: FastifyInstance) {
    // GET /api/music - Fetch all accessible music (admin + user's own)
    fastify.get("/", async (request, reply) => {
        try {
            const userId = request.user?.id;

            const tracks = await db.select({
                id: musicTrack.id,
                name: musicTrack.name,
                url: musicTrack.url,
                durationSeconds: musicTrack.durationSeconds,
                createdAt: musicTrack.createdAt,
            })
                .from(musicTrack)
                .where(
                    and(
                        eq(musicTrack.isActive, true),
                        userId
                            ? or(eq(musicTrack.userId, "admin"), eq(musicTrack.userId, userId))
                            : eq(musicTrack.userId, "admin")
                    )
                );
            return tracks;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch music tracks" });
        }
    });

    // GET /api/music/default - Fetch only default music
    fastify.get("/default", async (request, reply) => {
        try {
            const tracks = await db.select({
                id: musicTrack.id,
                name: musicTrack.name,
                url: musicTrack.url,
                durationSeconds: musicTrack.durationSeconds,
                createdAt: musicTrack.createdAt,
            })
                .from(musicTrack)
                .where(
                    and(
                        eq(musicTrack.isActive, true),
                        eq(musicTrack.userId, "admin")
                    )
                );
            return tracks;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch admin music tracks" });
        }
    });

    // GET /api/music/user - Fetch only user's music
    fastify.get("/user", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const tracks = await db.select({
                id: musicTrack.id,
                name: musicTrack.name,
                url: musicTrack.url,
                durationSeconds: musicTrack.durationSeconds,
                createdAt: musicTrack.createdAt,
            })
                .from(musicTrack)
                .where(
                    and(
                        eq(musicTrack.isActive, true),
                        eq(musicTrack.userId, userId)
                    )
                );
            return tracks;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch user music tracks" });
        }
    });

    // POST /api/music - Upload a new music track
    fastify.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: "No file uploaded" });
            }

            const buffer = await data.toBuffer();
            const filename = data.filename;
            const contentType = data.mimetype;

            // 1. Calculate duration
            let durationSeconds = null;
            try {
                const metadata = await parseBuffer(buffer, contentType);
                durationSeconds = Math.round(metadata.format.duration || 0);
            } catch (err) {
                fastify.log.warn({ err }, "Failed to parse music metadata");
            }

            // 2. Upload to Wasabi
            const key = `users_music/${request.user.id}/${randomUUID()}-${filename}`;
            const url = await storageProvider.uploadFile(buffer, key, contentType);

            // 3. Save to database
            const newTrack = {
                id: randomUUID(),
                name: filename,
                url: url,
                durationSeconds: durationSeconds,
                userId: request.user.id,
                isActive: true,
            };

            await db.insert(musicTrack).values(newTrack);
            return reply.status(201).send(newTrack);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to upload music track" });
        }
    });

    // PATCH /api/music/:id - Update a music track (name only)
    fastify.patch("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user.id;
            const { name } = request.body as { name?: string };

            if (!name) {
                return reply.status(400).send({ error: "Name is required" });
            }

            // Check ownership
            const existing = await db.select().from(musicTrack).where(and(eq(musicTrack.id, id), eq(musicTrack.userId, userId))).limit(1);
            if (existing.length === 0) {
                return reply.status(404).send({ error: "Music track not found or access denied" });
            }

            await db.update(musicTrack)
                .set({ name })
                .where(eq(musicTrack.id, id));

            return { id, name };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to update music track" });
        }
    });

    // DELETE /api/music/:id - Soft delete a music track
    fastify.delete("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user.id;

            // Check ownership
            const existing = await db.select().from(musicTrack).where(eq(musicTrack.id, id)).limit(1);
            if (existing.length === 0) {
                return reply.status(404).send({ error: "Music track not found" });
            }
            if (existing[0].userId !== userId) {
                return reply.status(403).send({ error: "Forbidden: You do not own this track" });
            }

            await db.update(musicTrack)
                .set({ isActive: false })
                .where(eq(musicTrack.id, id));

            return reply.status(204).send();
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to delete music track" });
        }
    });
}
