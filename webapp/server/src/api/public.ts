import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { storageProvider } from "../lib/storage.js";

const publicRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/public/lending-assets/:fileName
    fastify.withTypeProvider<ZodTypeProvider>().get("/lending-assets/:fileName", {
        schema: {
            params: z.object({
                fileName: z.string().min(1)
            }),
            description: "Get signed URL for lending page assets",
        }
    }, async (request, reply) => {
        const { fileName } = request.params;

        try {
            // Construct key for pub/lending location
            // Using pub/lending/ prefix as requested
            const key = `pub/lending/${fileName}`;

            const signedUrl = await storageProvider.getSignedUrl(key);

            return {
                success: true,
                url: signedUrl,
                fileName
            };

        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: "Failed to generate signed URL" });
        }
    });
}

export default publicRoutes;
