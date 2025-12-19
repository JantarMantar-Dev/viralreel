const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
require('dotenv').config()
const { toNodeHandler } = require("better-auth/node");
const { auth } = require('./lib/auth')

// Parse trusted origins
const trustedOrigins = (process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o); // Filter empty strings

// Register CORS
fastify.register(cors, {
    origin: [...trustedOrigins, process.env.CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    logger: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    credentials: true,
    maxAge: 86400
})

// Register authentication endpoint
fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
        try {
            // Construct request URL
            const url = new URL(request.url, `http://${request.headers.host}`);

            // Convert Fastify headers to standard Headers object
            const headers = new Headers();
            Object.entries(request.headers).forEach(([key, value]) => {
                if (value) headers.append(key, value.toString());
            });

            // Create Fetch API-compatible request
            const req = new Request(url.toString(), {
                method: request.method,
                headers,
                body: request.body ? JSON.stringify(request.body) : undefined,
            });

            // Process authentication request
            const response = await auth.handler(req);

            // Forward response to client
            reply.status(response.status);
            response.headers.forEach((value, key) => reply.header(key, value));
            reply.send(response.body ? await response.text() : null);

        } catch (error) {
            fastify.log.error("Authentication Error:", error);
            reply.status(500).send({
                error: "Internal authentication error",
                code: "AUTH_FAILURE"
            });
        }
    }
});

// Health check route
fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', message: 'Fastify server is running' }
})

// Run the server
const start = async () => {
    try {
        await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
