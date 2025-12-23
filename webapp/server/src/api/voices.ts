import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db } from "../db/index.js";
import { ttsVoice } from "../db/schema.js";
import { eq } from "drizzle-orm";

export default async function voicesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.get("/", async (request, reply) => {
        try {
            const voices = await db.select().from(ttsVoice).where(eq(ttsVoice.isActive, true));
            return voices;
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
            return voice[0];
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch voice" });
        }
    });
}
