/**
 * Niches API Tests
 *
 * Tests for /api/niches endpoints including:
 * - GET / - List all niches (admin + user's own)
 * - GET /check-name - Check if niche name is available
 * - POST / - Create a new niche
 * - PUT /:id - Update an existing niche
 * - DELETE /:id - Delete a niche
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import nicheRoutes from '../niches.js';

// ============================================================================
// Mocks
// ============================================================================

// Mock the auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn(async (request: any, reply: any) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }
  }),
}));

// Mock database
const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbUpdate = vi.fn();
const mockDbDelete = vi.fn();

vi.mock('../../db/index.js', () => ({
  db: {
    select: () => mockDbSelect(),
    insert: () => mockDbInsert(),
    update: () => mockDbUpdate(),
    delete: () => mockDbDelete(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

const testUser = {
  id: 'test_user_123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockNiches = [
  {
    id: 'niche_admin_1',
    name: 'Technology',
    userId: 'admin',
    description: 'Tech and gadgets',
    iconUrl: 'https://example.com/tech.png',
    iconName: 'Laptop',
    tags: 'tech,gadgets',
    scriptPrompt: 'Write about technology',
    videoPrompt: 'Create tech visuals',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'niche_user_1',
    name: 'My Custom Niche',
    userId: 'test_user_123',
    description: 'My personal niche',
    iconUrl: null,
    iconName: 'Star',
    tags: 'custom,personal',
    scriptPrompt: null,
    videoPrompt: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function createAuthenticatedTestFastify(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false });

  // Add user to request (simulates authenticated user)
  fastify.addHook('preHandler', async (request) => {
    (request as any).user = testUser;
    (request as any).session = { userId: testUser.id };
  });

  return fastify;
}

async function createUnauthenticatedTestFastify(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false });

  // No user on request (simulates unauthenticated)
  fastify.addHook('preHandler', async (request) => {
    (request as any).user = null;
    (request as any).session = null;
  });

  return fastify;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Niches API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // GET / - List Niches
  // --------------------------------------------------------------------------
  describe('GET / - List Niches', () => {
    it('should return admin and user niches for authenticated user', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      // Mock the database chain
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockNiches)),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('niche_admin_1');
      expect(body[1].id).toBe('niche_user_1');

      await fastify.close();
    });

    it('should return only admin niches for unauthenticated user', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const adminNiches = [mockNiches[0]];
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(adminNiches)),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveLength(1);
      expect(body[0].userId).toBe('admin');

      await fastify.close();
    });

    it('should handle database errors gracefully', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.reject(new Error('Database error'))),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Failed to fetch niches' });

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // GET /check-name - Check Name Availability
  // --------------------------------------------------------------------------
  describe('GET /check-name - Check Name Availability', () => {
    it('should return available for non-existing name', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches/check-name?name=NewNiche',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ isAvailable: true });

      await fastify.close();
    });

    it('should return unavailable for existing name', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockNiches[1]])),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches/check-name?name=My%20Custom%20Niche',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ isAvailable: false });

      await fastify.close();
    });

    it('should return available for empty name', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches/check-name',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ isAvailable: true });

      await fastify.close();
    });

    it('should return 401 for unauthenticated user', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/niches/check-name?name=Test',
      });

      expect(response.statusCode).toBe(401);

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // POST / - Create Niche
  // --------------------------------------------------------------------------
  describe('POST / - Create Niche', () => {
    it('should create a new niche successfully', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      // Check for duplicates - none found
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      // Insert succeeds
      mockDbInsert.mockReturnValue({
        values: vi.fn(() => Promise.resolve()),
      });

      const newNiche = {
        name: 'New Test Niche',
        description: 'A test niche',
        iconName: 'Star',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/niches',
        payload: newNiche,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.name).toBe('New Test Niche');
      expect(body.description).toBe('A test niche');
      expect(body.userId).toBe('test_user_123');
      expect(body.id).toBeDefined();

      await fastify.close();
    });

    it('should return 409 for duplicate niche name', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      // Check for duplicates - found one
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockNiches[1]])),
          })),
        })),
      });

      const newNiche = {
        name: 'My Custom Niche', // Already exists
        description: 'Duplicate',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/niches',
        payload: newNiche,
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toContain('already exists');

      await fastify.close();
    });

    it('should return 400 for missing name', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/niches',
        payload: { description: 'No name' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');

      await fastify.close();
    });

    it('should return 401 for unauthenticated user', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/niches',
        payload: { name: 'Test' },
      });

      expect(response.statusCode).toBe(401);

      await fastify.close();
    });

    it('should use default icon when not provided', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      mockDbInsert.mockReturnValue({
        values: vi.fn(() => Promise.resolve()),
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/niches',
        payload: { name: 'Minimal Niche' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.iconName).toBe('HelpCircle'); // Default icon

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // PUT /:id - Update Niche
  // --------------------------------------------------------------------------
  describe('PUT /:id - Update Niche', () => {
    it('should update a niche successfully', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbUpdate.mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      });

      const updateData = {
        name: 'Updated Niche Name',
        description: 'Updated description',
      };

      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/niches/niche_user_1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('niche_user_1');
      expect(body.name).toBe('Updated Niche Name');
      expect(body.description).toBe('Updated description');
      expect(body.updatedAt).toBeDefined();

      await fastify.close();
    });

    it('should allow partial updates', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbUpdate.mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      });

      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/niches/niche_user_1',
        payload: { description: 'Only description updated' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().description).toBe('Only description updated');

      await fastify.close();
    });

    it('should return 400 for invalid data', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/niches/niche_user_1',
        payload: { iconUrl: 'not-a-valid-url' }, // Should be a valid URL
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');

      await fastify.close();
    });

    it('should return 401 for unauthenticated user', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/niches/niche_user_1',
        payload: { name: 'Updated' },
      });

      expect(response.statusCode).toBe(401);

      await fastify.close();
    });

    it('should handle database errors', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbUpdate.mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.reject(new Error('DB error'))),
        })),
      });

      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/niches/niche_user_1',
        payload: { name: 'Updated' },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Failed to update niche' });

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /:id - Delete Niche
  // --------------------------------------------------------------------------
  describe('DELETE /:id - Delete Niche', () => {
    it('should delete a niche successfully', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbDelete.mockReturnValue({
        where: vi.fn(() => Promise.resolve()),
      });

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/niches/niche_user_1',
      });

      expect(response.statusCode).toBe(204);

      await fastify.close();
    });

    it('should return 401 for unauthenticated user', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/niches/niche_user_1',
      });

      expect(response.statusCode).toBe(401);

      await fastify.close();
    });

    it('should handle database errors', async () => {
      const fastify = await createAuthenticatedTestFastify();
      fastify.register(nicheRoutes, { prefix: '/api/niches' });
      await fastify.ready();

      mockDbDelete.mockReturnValue({
        where: vi.fn(() => Promise.reject(new Error('DB error'))),
      });

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/niches/niche_user_1',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Failed to delete niche' });

      await fastify.close();
    });
  });
});
