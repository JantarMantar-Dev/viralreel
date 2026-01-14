/**
 * Fastify Test Helpers
 *
 * Utilities for creating test Fastify instances with proper configuration
 */

import Fastify, { FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

// ============================================================================
// Types
// ============================================================================

export interface MockSession {
  userId: string | null;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
}

export interface TestFastifyOptions {
  /** Whether to add authenticated user to requests */
  authenticated?: boolean;
  /** Custom user to inject */
  user?: MockUser;
  /** Custom session data */
  session?: MockSession;
}

// ============================================================================
// Default Test User
// ============================================================================

export const defaultTestUser: MockUser = {
  id: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User',
};

export const defaultTestSession: MockSession = {
  userId: 'test_user_123',
};

// ============================================================================
// Test Fastify Factory
// ============================================================================

/**
 * Creates a Fastify instance configured for testing
 *
 * @param options - Configuration options
 * @returns Configured Fastify instance
 *
 * @example
 * ```ts
 * const fastify = await createTestFastify({ authenticated: true });
 * fastify.register(myRoutes);
 * await fastify.ready();
 *
 * const response = await fastify.inject({
 *   method: 'POST',
 *   url: '/my-endpoint',
 *   payload: { data: 'test' }
 * });
 * ```
 */
export async function createTestFastify(options: TestFastifyOptions = {}): Promise<FastifyInstance> {
  const { authenticated = true, user = defaultTestUser, session = defaultTestSession } = options;

  const fastify = Fastify({
    logger: false, // Disable logging in tests
  });

  // Setup Zod validation
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Add session/user to requests based on authentication setting
  fastify.addHook('preHandler', async (request) => {
    const req = request as unknown as { session: MockSession; user: MockUser | null };
    if (authenticated) {
      req.session = session;
      req.user = user;
    } else {
      req.session = { userId: null };
      req.user = null;
    }
  });

  return fastify;
}

/**
 * Creates an unauthenticated Fastify instance for testing auth failures
 */
export async function createUnauthenticatedTestFastify(): Promise<FastifyInstance> {
  return createTestFastify({ authenticated: false });
}

// ============================================================================
// Request Helpers
// ============================================================================

export interface InjectOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  payload?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Helper to create inject options with common defaults
 */
export function createInjectOptions(options: InjectOptions): InjectOptions {
  return {
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Parses and validates a successful JSON response
 */
export function expectSuccessResponse<T>(response: { statusCode: number; json: () => T }): T {
  if (response.statusCode !== 200 && response.statusCode !== 201) {
    throw new Error(`Expected success status, got ${response.statusCode}: ${JSON.stringify(response.json())}`);
  }
  return response.json();
}

/**
 * Parses and validates an error response
 */
export function expectErrorResponse(
  response: { statusCode: number; json: () => unknown },
  expectedStatus: number
): { error: string; details?: unknown } {
  if (response.statusCode !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.statusCode}`);
  }
  return response.json() as { error: string; details?: unknown };
}
