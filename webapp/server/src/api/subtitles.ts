
import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { subtitleStyle } from "../db/schema.js";
import { eq } from "drizzle-orm";

export default async function subtitleRoutes(fastify: FastifyInstance) {
    // GET /api/subtitles - Fetch all active subtitle styles
    fastify.get("/", async (request, reply) => {
        try {
            const styles = await db.select({
                id: subtitleStyle.id,
                name: subtitleStyle.name,
                description: subtitleStyle.description,
                preview: subtitleStyle.previewText,
                css: subtitleStyle.css,
            })
                .from(subtitleStyle)
                .where(eq(subtitleStyle.isActive, true));

            return styles;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch subtitle styles" });
        }
    });
}
