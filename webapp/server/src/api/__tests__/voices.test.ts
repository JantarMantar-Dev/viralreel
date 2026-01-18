/**
 * Voices API Tests
 *
 * Tests for /api/voices endpoints including:
 * - GET / - List all active voices
 * - GET /:id - Get a specific voice by ID
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestFastify } from '../../test/helpers/fastify.js';
import voicesRoutes from '../voices.js';

// ============================================================================
// Mocks
// ============================================================================

// Mock storage provider
vi.mock('../../lib/storage.js', () => ({
  storageProvider: {
    getSignedUrl: vi.fn((url: string) => Promise.resolve(`signed_${url}`)),
  },
}));

// Mock database with flexible structure
const mockDbSelect = vi.fn();

vi.mock('../../db/index.js', () => ({
  db: {
    select: () => mockDbSelect(),
  },
}));

// Import mocked modules
import { storageProvider } from '../../lib/storage.js';

// ============================================================================
// Test Data Factory
// ============================================================================

function getMockVoices() {
  return [
    {
      id: 'voice_1',
      name: 'Emily',
      provider: 'elevenlabs',
      providerId: 'el_voice_1',
      gender: 'female',
      accent: 'american',
      description: 'A warm, friendly female voice',
      previewUrl: 'voices/emily-preview.mp3',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'voice_2',
      name: 'James',
      provider: 'elevenlabs',
      providerId: 'el_voice_2',
      gender: 'male',
      accent: 'british',
      description: 'A deep, professional male voice',
      previewUrl: 'https://example.com/james-preview.mp3', // Already a full URL
      isActive: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'voice_3',
      name: 'Sarah',
      provider: 'google',
      providerId: 'g_voice_1',
      gender: 'female',
      accent: 'neutral',
      description: 'A clear, neutral female voice',
      previewUrl: null, // No preview
      isActive: true,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Voices API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the storage mock to its default successful behavior
    // This is needed because some tests mock it to reject
    vi.mocked(storageProvider.getSignedUrl).mockReset();
    vi.mocked(storageProvider.getSignedUrl).mockImplementation((url: string) => 
      Promise.resolve(`signed_${url}`)
    );
  });

  afterEach(async () => {
    // Don't use restoreAllMocks as it would remove the vi.mock factory implementations
  });

  // --------------------------------------------------------------------------
  // GET / - List Voices
  // --------------------------------------------------------------------------
  describe('GET / - List Voices', () => {
    it('should return list of active voices', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock the database chain
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(getMockVoices())),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveLength(3);
      
      // First voice should have signed URL (relative path)
      expect(body[0].id).toBe('voice_1');
      expect(body[0].previewUrl).toBe('signed_voices/emily-preview.mp3');
      
      // Second voice should keep original URL (already http)
      expect(body[1].id).toBe('voice_2');
      expect(body[1].previewUrl).toBe('https://example.com/james-preview.mp3');
      
      // Third voice has null previewUrl
      expect(body[2].id).toBe('voice_3');
      expect(body[2].previewUrl).toBeNull();

      await fastify.close();
    });

    it('should return empty array when no voices available', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock empty result
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);

      await fastify.close();
    });

    it('should handle database errors gracefully', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock database error
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.reject(new Error('Database connection failed'))),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Failed to fetch voices' });

      await fastify.close();
    });

    it('should handle storage signing errors gracefully', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock voices with relative URL
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([getMockVoices()[0]])),
        })),
      });

      // Mock storage error
      vi.mocked(storageProvider.getSignedUrl).mockRejectedValue(new Error('Storage unavailable'));

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Failed to fetch voices' });

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // GET /:id - Get Voice by ID
  // --------------------------------------------------------------------------
  describe('GET /:id - Get Voice by ID', () => {
    it('should return a specific voice by ID with signed URL', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock the database chain for GET /:id (uses .where().limit())
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([getMockVoices()[0]])),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices/voice_1',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('voice_1');
      expect(body.name).toBe('Emily');
      expect(body.previewUrl).toBe('signed_voices/emily-preview.mp3');

      await fastify.close();
    });

    it('should return voice with full URL unchanged', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock the database chain with voice that has full URL
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([getMockVoices()[1]])),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices/voice_2',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('voice_2');
      expect(body.previewUrl).toBe('https://example.com/james-preview.mp3');
      // getSignedUrl should not be called for http URLs
      expect(storageProvider.getSignedUrl).not.toHaveBeenCalled();

      await fastify.close();
    });

    it('should return 404 when voice not found', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock empty result
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Voice not found' });

      await fastify.close();
    });

    it('should handle database errors for single voice', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock database error
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.reject(new Error('Database error'))),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices/voice_1',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Failed to fetch voice' });

      await fastify.close();
    });

    it('should handle null previewUrl gracefully', async () => {
      const fastify = await createTestFastify();
      fastify.register(voicesRoutes, { prefix: '/api/voices' });
      await fastify.ready();

      // Mock voice with null previewUrl
      mockDbSelect.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([getMockVoices()[2]])),
          })),
        })),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/voices/voice_3',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe('voice_3');
      expect(body.previewUrl).toBeNull();
      expect(storageProvider.getSignedUrl).not.toHaveBeenCalled();

      await fastify.close();
    });
  });
});
