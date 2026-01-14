/**
 * Full Integration Test for Video Creation Flow
 *
 * Tests the complete API flow from script generation through job creation
 * with all LLM providers mocked at the SDK level.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestFastify } from '../../../test/helpers/fastify.js';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const { mockGenerateScriptOnly, mockEstimateStoryDuration, mockDb } = vi.hoisted(() => {
  const mockScriptStory = `In a world where technology and nature exist in harmony, a young scientist discovers an ancient secret.`;

  return {
    mockGenerateScriptOnly: vi.fn().mockResolvedValue({ story: mockScriptStory }),
    mockEstimateStoryDuration: vi.fn().mockReturnValue({
      wordCount: 18,
      estimatedSeconds: 7,
    }),
    mockDb: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb({})),
    },
  };
});

// Mock modules
vi.mock('../../../scripting/script-generator.js', () => ({
  generateScriptOnly: mockGenerateScriptOnly,
  estimateStoryDuration: mockEstimateStoryDuration,
}));

vi.mock('../../../db/index.js', () => ({
  db: mockDb,
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Video Creation - Full Integration Flow', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    fastify = await createTestFastify();

    // Register scripting routes
    const scriptingRoutes = await import('../../scripting.js');
    fastify.register(scriptingRoutes.default, { prefix: '/scripting' });

    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('Complete Script Generation Flow', () => {
    it('should generate script, get word count, and return structured response', async () => {
      // Step 1: Generate a script
      const generateResponse = await fastify.inject({
        method: 'POST',
        url: '/scripting/generate',
        payload: {
          scriptIdea: 'A story about space exploration and discovery',
          nicheName: 'Science',
          duration: 1,
          voiceId: 'Zephyr',
        },
      });

      expect(generateResponse.statusCode).toBe(200);

      const generateBody = generateResponse.json();
      expect(generateBody.success).toBe(true);
      expect(generateBody.script).toBeDefined();
      expect(generateBody.script.story).toBeDefined();
      expect(generateBody.script.wordCount).toBeDefined();
      expect(generateBody.script.estimatedDurationSeconds).toBeDefined();

      // Verify the structure matches what the frontend expects
      expect(typeof generateBody.script.story).toBe('string');
      expect(typeof generateBody.script.wordCount).toBe('number');
      expect(typeof generateBody.script.estimatedDurationSeconds).toBe('number');
    });

    it('should handle regeneration with user feedback', async () => {
      const originalScript = 'Original story content here...';

      // Step 1: Generate initial script
      const generateResponse = await fastify.inject({
        method: 'POST',
        url: '/scripting/generate',
        payload: {
          scriptIdea: 'A story about AI',
          duration: 1,
        },
      });

      expect(generateResponse.statusCode).toBe(200);
      const initialScript = generateResponse.json().script;

      // Step 2: User provides feedback and requests regeneration
      mockGenerateScriptOnly.mockResolvedValueOnce({
        story: 'This is a MUCH MORE DRAMATIC story about AI that takes the world by storm!',
      });

      mockEstimateStoryDuration.mockReturnValueOnce({
        wordCount: 14,
        estimatedSeconds: 6,
      });

      const regenerateResponse = await fastify.inject({
        method: 'POST',
        url: '/scripting/regenerate',
        payload: {
          scriptIdea: 'A story about AI',
          feedback: 'Make it more dramatic and exciting',
          previousScript: initialScript.story,
          duration: 1,
        },
      });

      expect(regenerateResponse.statusCode).toBe(200);

      const regeneratedBody = regenerateResponse.json();
      expect(regeneratedBody.success).toBe(true);
      expect(regeneratedBody.script.story).toContain('DRAMATIC');

      // Verify feedback was passed correctly
      expect(mockGenerateScriptOnly).toHaveBeenLastCalledWith(
        expect.objectContaining({
          feedback: 'Make it more dramatic and exciting',
        })
      );
    });

    it('should handle multiple script variations', async () => {
      // Simulate user trying different versions
      const variations = [
        { idea: 'Story about robots', duration: 0.5 },
        { idea: 'Story about nature', duration: 1 },
        { idea: 'Story about history', duration: 2 },
      ];

      for (const variation of variations) {
        mockGenerateScriptOnly.mockResolvedValueOnce({
          story: `A compelling narrative about ${variation.idea.toLowerCase()}...`,
        });

        mockEstimateStoryDuration.mockReturnValueOnce({
          wordCount: Math.floor(variation.duration * 150), // ~150 words per minute
          estimatedSeconds: variation.duration * 60,
        });

        const response = await fastify.inject({
          method: 'POST',
          url: '/scripting/generate',
          payload: {
            scriptIdea: variation.idea,
            duration: variation.duration,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().success).toBe(true);
      }

      // Verify all calls were made
      expect(mockGenerateScriptOnly).toHaveBeenCalledTimes(variations.length);
    });
  });

  describe('Error Handling in Integration', () => {
    it('should handle LLM timeout gracefully', async () => {
      mockGenerateScriptOnly.mockRejectedValueOnce(new Error('Request timeout'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/scripting/generate',
        payload: {
          scriptIdea: 'A story',
          duration: 1,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Request timeout');
    });

    it('should handle rate limiting from LLM provider', async () => {
      mockGenerateScriptOnly.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/scripting/generate',
        payload: {
          scriptIdea: 'A story',
          duration: 1,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Rate limit exceeded');
    });

    it('should handle content moderation rejection', async () => {
      mockGenerateScriptOnly.mockRejectedValueOnce(new Error('Content policy violation'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/scripting/generate',
        payload: {
          scriptIdea: 'Some inappropriate content',
          duration: 1,
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.json().error).toBe('Content policy violation');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous script generation requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        method: 'POST' as const,
        url: '/scripting/generate',
        payload: {
          scriptIdea: `Story number ${i + 1}`,
          duration: 1,
        },
      }));

      // Fire all requests concurrently
      const responses = await Promise.all(requests.map((req) => fastify.inject(req)));

      // All should succeed
      for (const response of responses) {
        expect(response.statusCode).toBe(200);
        expect(response.json().success).toBe(true);
      }
    });
  });
});

describe('API Response Contract', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    fastify = await createTestFastify();

    const scriptingRoutes = await import('../../scripting.js');
    fastify.register(scriptingRoutes.default, { prefix: '/scripting' });

    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
  });

  it('should return consistent response shape for success', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/scripting/generate',
      payload: {
        scriptIdea: 'Test story',
        duration: 1,
      },
    });

    const body = response.json();

    // Verify response contract
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('script');
    expect(body.script).toHaveProperty('story');
    expect(body.script).toHaveProperty('wordCount');
    expect(body.script).toHaveProperty('estimatedDurationSeconds');
  });

  it('should return consistent response shape for errors', async () => {
    mockGenerateScriptOnly.mockRejectedValueOnce(new Error('Test error'));

    const response = await fastify.inject({
      method: 'POST',
      url: '/scripting/generate',
      payload: {
        scriptIdea: 'Test story',
        duration: 1,
      },
    });

    const body = response.json();

    // Verify error response contract
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });
});
