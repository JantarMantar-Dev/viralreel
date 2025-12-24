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

// Helper to determine key and get signed URL
async function getSignedUrlFromUrl(urlStr: string): Promise<string> {
    try {
        // If it's already a signed URL (unlikely to be stored this way, but strictly speaking), just return it? 
        // No, signed URLs expire. We assume stored URL is the "permanent" public URL structure 
        // (https://endpoint/bucket/key) from which we extract key.

        const url = new URL(urlStr);
        const pathParts = url.pathname.split('/').filter(p => p);

        // Remove bucket name (first part) to get key
        // NOTE: This assumes path-style URLs: /bucket/key/path...
        pathParts.shift();
        const key = pathParts.join('/');

        if (!key) return urlStr; // Fallback to original if no key found

        return await storageProvider.getSignedUrl(key);
    } catch (e) {
        return urlStr; // Fallback if parsing fails
    }
}

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

            // Sign URLs
            const signedTracks = await Promise.all(tracks.map(async (t) => ({
                ...t,
                url: await getSignedUrlFromUrl(t.url)
            })));

            return signedTracks;
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

            // Sign URLs
            const signedTracks = await Promise.all(tracks.map(async (t) => ({
                ...t,
                url: await getSignedUrlFromUrl(t.url)
            })));

            return signedTracks;
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

            // Sign URLs
            const signedTracks = await Promise.all(tracks.map(async (t) => ({
                ...t,
                url: await getSignedUrlFromUrl(t.url)
            })));

            return signedTracks;
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

            // Return with signed URL
            const signedUrl = await storageProvider.getSignedUrl(key);

            return reply.status(201).send({
                ...newTrack,
                url: signedUrl
            });
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

            const updateMusicSchema = z.object({
                name: z.string().min(1, "Name is required"),
            });

            const validation = updateMusicSchema.safeParse(request.body);

            if (!validation.success) {
                return reply.status(400).send({
                    error: "Validation failed",
                    details: validation.error.format()
                });
            }

            const { name } = validation.data;

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
            if (existing[0].userId === "admin") {
                return reply.status(403).send({ error: "Forbidden: Cannot delete system tracks" });
            }
            if (existing[0].userId !== userId) {
                return reply.status(403).send({ error: "Forbidden: You do not own this track" });
            }

            try {
                // Extract key from URL
                // URL format: https://endpoint/bucket/users_music/userId/uuid-filename
                // Key format: users_music/userId/uuid-filename
                const url = new URL(existing[0].url);
                // pathname will be /bucket/users_music/...
                const pathParts = url.pathname.split('/').filter(p => p);
                // Remove bucket name (first part)
                pathParts.shift();
                const key = pathParts.join('/');

                if (key) {
                    await storageProvider.deleteFile(key);
                }
            } catch (err) {
                request.log.warn({ err, url: existing[0].url }, "Failed to delete file from S3");
                // Continue with DB deletion even if S3 fails
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
