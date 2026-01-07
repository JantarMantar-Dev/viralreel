import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db } from "../db/index.js";
import { ttsVoice } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { storageProvider } from "../lib/storage.js";

export default async function voicesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.get("/", async (request, reply) => {
        try {
            const voices = await db.select().from(ttsVoice).where(eq(ttsVoice.isActive, true));

            // Sign URLs for all voices
            const voicesWithSignedUrls = await Promise.all(voices.map(async (voice) => {
                if (voice.previewUrl && !voice.previewUrl.startsWith("http")) {
                    voice.previewUrl = await storageProvider.getSignedUrl(voice.previewUrl);
                }
                return voice;
            }));

            return voicesWithSignedUrls;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch voices" });
        }
    });

    fastify.get("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            const voice = await db.select().from(ttsVoice).where(eq(ttsVoice.id, id)).limit(1);
            if (voice.length === 0) {
                return reply.status(404).send({ error: "Voice not found" });
            }

            const voiceData = voice[0];
            if (voiceData.previewUrl && !voiceData.previewUrl.startsWith("http")) {
                voiceData.previewUrl = await storageProvider.getSignedUrl(voiceData.previewUrl);
            }

            return voiceData;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch voice" });
        }
    });
}
