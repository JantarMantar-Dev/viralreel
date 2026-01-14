/**
 * Integration Tests for Scripting API
 *
 * Tests the /api/scripting endpoints with mocked LLM providers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestFastify, createUnauthenticatedTestFastify } from '../../test/helpers/fastify.js';

// ============================================================================
// Hoisted Mocks - These must be defined before vi.mock
// ============================================================================

const { mockGenerateScriptOnly, mockEstimateStoryDuration, mockScriptStory } = vi.hoisted(() => {
  const mockScriptStory = `In a world where technology and nature exist in harmony, a young scientist named Maya discovers an ancient algorithm hidden within the genetic code of redwood trees. As she deciphers its secrets, she realizes it holds the key to sustainable energy that could power the entire planet.`;

  return {
    mockGenerateScriptOnly: vi.fn(),
    mockEstimateStoryDuration: vi.fn(),
    mockScriptStory,
  };
});

// ============================================================================
// Mock the script generator module
// ============================================================================

vi.mock('../../scripting/script-generator.js', () => ({
  generateScriptOnly: mockGenerateScriptOnly,
  estimateStoryDuration: mockEstimateStoryDuration,
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Scripting API', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockGenerateScriptOnly.mockResolvedValue({
      story: mockScriptStory,
    });

    mockEstimateStoryDuration.mockReturnValue({
      wordCount: 67,
      estimatedSeconds: 27,
    });

    // Create test Fastify instance
    fastify = await createTestFastify();

    // Import and register the scripting routes
    const scriptingRoutes = await import('../scripting.js');
    fastify.register(scriptingRoutes.default);

    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
  });

  // ==========================================================================
  // POST /generate
  // ==========================================================================

  describe('POST /generate', () => {
    it('should generate a script successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: 'A story about AI and nature',
          nicheName: 'Technology',
          duration: 1,
          voiceId: 'Zephyr',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.script).toBeDefined();
      expect(body.script.story).toBe(mockScriptStory);
      expect(body.script.wordCount).toBe(67);
      expect(body.script.estimatedDurationSeconds).toBe(27);

      // Verify the generator was called with correct params
      expect(mockGenerateScriptOnly).toHaveBeenCalledWith({
        scriptIdea: 'A story about AI and nature',
        nicheName: 'Technology',
        duration: 1,
        voiceId: 'Zephyr',
      });
    });

    it('should use default values for optional fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: 'A simple story',
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify defaults were applied
      expect(mockGenerateScriptOnly).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptIdea: 'A simple story',
          duration: 1, // default
          voiceId: 'Zephyr', // default
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      // Create unauthenticated instance
      const unauthFastify = await createUnauthenticatedTestFastify();
      const scriptingRoutes = await import('../scripting.js');
      unauthFastify.register(scriptingRoutes.default);
      await unauthFastify.ready();

      const response = await unauthFastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: 'Test',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: 'Unauthorized' });

      await unauthFastify.close();
    });

    it('should return 400 for missing scriptIdea', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          nicheName: 'Technology',
        },
      });

      expect(response.statusCode).toBe(400);

      const body = response.json();
      expect(body.error).toBe('Validation failed');
    });

    it('should return 400 for empty scriptIdea', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for duration out of range', async () => {
      // Duration too high
      const response1 = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: 'Test',
          duration: 10, // Max is 5
        },
      });

      expect(response1.statusCode).toBe(400);

      // Duration too low
      const response2 = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: 'Test',
          duration: 0.1, // Min is 0.5
        },
      });

      expect(response2.statusCode).toBe(400);
    });

    it('should handle generator errors gracefully', async () => {
      mockGenerateScriptOnly.mockRejectedValue(new Error('LLM API rate limit exceeded'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/generate',
        payload: {
          scriptIdea: 'A story',
        },
      });

      expect(response.statusCode).toBe(500);

      const body = response.json();
      expect(body.error).toBe('LLM API rate limit exceeded');
    });
  });

  // ==========================================================================
  // POST /regenerate
  // ==========================================================================

  describe('POST /regenerate', () => {
    it('should regenerate a script with feedback', async () => {
      const regeneratedStory = 'In a DRAMATIC world where technology and nature clash...';

      mockGenerateScriptOnly.mockResolvedValue({
        story: regeneratedStory,
      });

      mockEstimateStoryDuration.mockReturnValue({
        wordCount: 52,
        estimatedSeconds: 21,
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/regenerate',
        payload: {
          scriptIdea: 'A story about AI',
          feedback: 'Make it more dramatic',
          previousScript: 'Original script content...',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.script.story).toBe(regeneratedStory);

      // Verify feedback was passed to generator
      expect(mockGenerateScriptOnly).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: 'Make it more dramatic',
          previousScript: 'Original script content...',
        })
      );
    });

    it('should regenerate without feedback (just new attempt)', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/regenerate',
        payload: {
          scriptIdea: 'A story about AI',
          duration: 2,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify it was called without feedback
      expect(mockGenerateScriptOnly).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptIdea: 'A story about AI',
          duration: 2,
          feedback: undefined,
          previousScript: undefined,
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      const unauthFastify = await createUnauthenticatedTestFastify();
      const scriptingRoutes = await import('../scripting.js');
      unauthFastify.register(scriptingRoutes.default);
      await unauthFastify.ready();

      const response = await unauthFastify.inject({
        method: 'POST',
        url: '/regenerate',
        payload: {
          scriptIdea: 'Test',
        },
      });

      expect(response.statusCode).toBe(401);

      await unauthFastify.close();
    });

    it('should handle regeneration errors', async () => {
      mockGenerateScriptOnly.mockRejectedValue(new Error('Content policy violation'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/regenerate',
        payload: {
          scriptIdea: 'A story',
          feedback: 'Make changes',
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Content policy violation');
    });
  });
});
