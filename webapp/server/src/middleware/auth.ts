import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { auth } from "../lib/auth.js";

// Extend FastifyRequest type to include user and session
declare module "fastify" {
    interface FastifyRequest {
        user?: any;
        session?: any;
    }
}

/**
 * Middleware to extract session from headers and decorate the request object.
 * This should be used as a preHandler for routes that need authentication context.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Skip auth check for auth routes to avoid double session loading
        if (request.url.startsWith("/api/auth")) {
            return;
        }

        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    value.forEach(v => headers.append(key, v));
                } else {
                    headers.set(key, value.toString());
                }
            }
        });

        const session = await auth.api.getSession({ headers });

        if (session) {
            request.user = session.user;
            request.session = session.session;
        }
    } catch (error) {
        request.log.error(error, "Authentication middleware error");
        // We don't throw here to allow optional authentication on some routes
    }
}

/**
 * Middleware to strictly require authentication.
 * Returns 401 if no valid session is found.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
    }
}

/**
 * Register auth decorators and hooks
 */
// Register auth decorators and hooks
const authMiddleware = async (fastify: FastifyInstance) => {
    fastify.decorateRequest('user', null);
    fastify.decorateRequest('session', null);

    // Add global hook to enrich all requests with session if available
    fastify.addHook('preHandler', authenticate);
};

export default fp(authMiddleware);
