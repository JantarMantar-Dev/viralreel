import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import WelcomeEmail from "./emails/welcome.js";
import VerifyEmail from "./emails/verify.js";
import { auth } from './lib/auth.js';
import { posthog } from './lib/posthog.js';
import authMiddleware from './middleware/auth.js';
import nicheRoutes from './api/niches.js';
import voicesRoutes from './api/voices.js';
import musicRoutes from './api/music.js';
import subtitleRoutes from "./api/subtitles.js";
import { runMigrations } from "./db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import fastifyRawBody from 'fastify-raw-body';

const fastify = Fastify({
    logger: true,
    trustProxy: true // trust the proxy to set the correct protocol and ip
});

// Register raw body for Stripe webhooks
fastify.register(fastifyRawBody, {
    field: 'rawBody', // field name to store the raw body
    global: false,    // only active on routes that have it enabled
    encoding: false,  // get raw buffer
    runFirst: true,   // run before other hooks
});

// Add Zod validator and serializer
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Parse trusted origins
const trustedOrigins = (process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o); // Filter empty strings

// Register CORS
fastify.register(cors, {
    origin: [...trustedOrigins, process.env.CLIENT_URL || "", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    credentials: true,
    maxAge: 86400
});

// Register static file serving
fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../assets'),
    prefix: '/assets/', // optional: default '/'
});

// Register multipart support for file uploads
fastify.register(fastifyMultipart, {
    limits: {
        fieldNameSize: 100, // Max field name size in bytes
        fieldSize: 100,     // Max field value size in bytes
        fields: 10,         // Max number of non-file fields
        fileSize: 50 * 1024 * 1024, // 50MB max file size
        files: 1,           // Max number of file fields
    }
});

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

            const response = await auth.handler(req);

            console.log(`[Auth] Response Status: ${response.status}`);

            // Forward response to client
            reply.status(response.status);
            response.headers.forEach((value, key) => reply.header(key, value));
            reply.send(response.body ? await response.text() : null);

        } catch (error) {
            fastify.log.error(error as Error, "Authentication Error");
            posthog.capture({
                distinctId: 'server',
                event: 'server_auth_error',
                properties: {
                    error: (error as Error).message,
                    path: request.url
                }
            })
            reply.status(500).send({
                error: "Internal authentication error",
                code: "AUTH_FAILURE"
            });
        }
    }
});

// Health check routes
fastify.get('/api/health', async (_request, _reply) => {
    return { status: 'ok', message: 'Fastify server is running' };
});

fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', message: 'Public health check' };
});

// Register authentication middleware
fastify.register(authMiddleware);

// Register modular API routes
fastify.register(nicheRoutes, { prefix: "/api/niches" });
fastify.register(voicesRoutes, { prefix: "/api/voices" });
fastify.register(musicRoutes, { prefix: "/api/music" });
fastify.register(subtitleRoutes, { prefix: "/api/subtitles" });
import jobRoutes from "./api/jobs.js";
fastify.register(jobRoutes, { prefix: "/api/jobs" });
import projectsRoutes from "./api/projects.js";
fastify.register(projectsRoutes, { prefix: "/api/projects" });
import paymentsRoutes from "./api/payments.js";
fastify.register(paymentsRoutes, { prefix: "/api/payments" });
import publicRoutes from "./api/public.js";
fastify.register(publicRoutes, { prefix: "/api/public" });

// Run the server
const start = async () => {
    try {
        await runMigrations();

        // Debug Auth Environment Variables
        console.log("--- Auth Configuration Check ---");
        console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
        console.log("BETTER_AUTH_SECRET present:", !!process.env.BETTER_AUTH_SECRET);
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("--------------------------------");

        await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
