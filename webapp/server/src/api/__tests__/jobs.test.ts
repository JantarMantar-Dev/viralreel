/**
 * Jobs API Tests
 *
 * Tests for /api/jobs endpoints including:
 * - GET / - List all render jobs
 * - GET /:videoId - Get video details
 * - POST / - Create a new video job
 * - POST /:videoId/render - Trigger rendering
 * - POST /:videoId/retry - Retry failed processing
 * - PATCH /:videoId - Update video metadata
 * - DELETE /:videoId - Delete a video
 * - POST /series/:seriesId/episode - Add episode to series
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestFastify, createUnauthenticatedTestFastify } from '../../test/helpers/fastify.js';
import jobRoutes from '../jobs.js';

// ============================================================================
// Mocks
// ============================================================================

// Mock video-service
vi.mock('../../services/video-service.js', () => ({
  createVideoJob: vi.fn(),
  deleteVideo: vi.fn(),
  queueVideoRender: vi.fn(),
  updateVideoMetadata: vi.fn(),
  retryVideoProcessing: vi.fn(),
}));

// Mock storage provider
vi.mock('../../lib/storage.js', () => ({
  storageProvider: {
    getSignedUrlFromFullUrl: vi.fn((url: string) => Promise.resolve(url ? `signed_${url}` : '')),
  },
}));

// Mock database
vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
        leftJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));

// Import mocked modules
import { createVideoJob, deleteVideo, queueVideoRender, updateVideoMetadata, retryVideoProcessing } from '../../services/video-service.js';
import { db } from '../../db/index.js';

// ============================================================================
// Test Data
// ============================================================================

const validSimpleJobPayload = {
  jobType: 'video' as const,
  scriptIdea: 'A story about a mysterious forest',
  episodeTitle: 'The Hidden Path',
  nicheId: 'niche_123',
  duration: 1.5,
  segments: 3,
  visualFormat: 'image' as const,
  aspectRatio: 'portrait' as const,
  isDraft: false,
};

const validSeriesJobPayload = {
  jobType: 'series' as const,
  scriptIdea: 'A journey through ancient ruins',
  seriesName: 'Ancient Mysteries',
  episodeTitle: 'Episode 1: The Beginning',
  nicheId: 'niche_456',
  duration: 2,
  segments: 4,
  visualFormat: 'video' as const,
  aspectRatio: 'landscape' as const,
  isDraft: false,
};

const mockJobsList = [
  {
    jobId: 'job_1',
    status: 'COMPLETED',
    progress: 100,
    createdAt: new Date('2024-01-01'),
    videoId: 'video_1',
    title: 'Test Video 1',
    metadata: { duration: 1.5 },
    seriesId: 'series_1',
    seriesName: 'Test Series',
  },
  {
    jobId: 'job_2',
    status: 'PROCESSING',
    progress: 50,
    createdAt: new Date('2024-01-02'),
    videoId: 'video_2',
    title: 'Test Video 2',
    metadata: { duration: 2 },
    seriesId: null,
    seriesName: null,
  },
];

const mockVideoDetails = {
  id: 'video_1',
  title: 'Test Video',
  status: 'COMPLETED',
  metadata: { duration: 1.5, segments: 3 },
  seriesId: 'series_1',
  seriesName: 'Test Series',
  nicheId: 'niche_123',
  renderStatus: 'COMPLETED',
  outputUrl: 'https://storage.example.com/video.mp4',
  compressedUrl: 'https://storage.example.com/video_compressed.mp4',
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Jobs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Authentication Tests
  // --------------------------------------------------------------------------
  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests to GET /', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: 'Unauthorized' });

      await fastify.close();
    });

    it('should return 401 for unauthenticated requests to POST /', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(401);

      await fastify.close();
    });

    it('should return 401 for unauthenticated requests to DELETE /:videoId', async () => {
      const fastify = await createUnauthenticatedTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/jobs/video_123',
      });

      expect(response.statusCode).toBe(401);

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // GET / - List Jobs
  // --------------------------------------------------------------------------
  describe('GET / - List Jobs', () => {
    it('should return list of jobs for authenticated user', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock the database chain to return jobs
      const mockOrderBy = vi.fn(() => Promise.resolve(mockJobsList));
      const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
      const mockLeftJoin = vi.fn(() => ({ where: mockWhere }));
      const mockInnerJoin = vi.fn(() => ({ leftJoin: mockLeftJoin }));
      const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      // Dates are serialized as ISO strings in JSON response
      expect(body.jobs).toHaveLength(mockJobsList.length);
      expect(body.jobs[0].jobId).toBe('job_1');
      expect(body.jobs[0].status).toBe('COMPLETED');
      expect(body.jobs[1].jobId).toBe('job_2');
      expect(body.jobs[1].status).toBe('PROCESSING');

      await fastify.close();
    });

    it('should return empty array when user has no jobs', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock empty result
      const mockOrderBy = vi.fn(() => Promise.resolve([]));
      const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
      const mockLeftJoin = vi.fn(() => ({ where: mockWhere }));
      const mockInnerJoin = vi.fn(() => ({ leftJoin: mockLeftJoin }));
      const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ jobs: [] });

      await fastify.close();
    });

    it('should handle database errors gracefully', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock database error
      const mockOrderBy = vi.fn(() => Promise.reject(new Error('Database connection failed')));
      const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
      const mockLeftJoin = vi.fn(() => ({ where: mockWhere }));
      const mockInnerJoin = vi.fn(() => ({ leftJoin: mockLeftJoin }));
      const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/jobs',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Database connection failed' });

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // GET /:videoId - Get Video Details
  // --------------------------------------------------------------------------
  describe('GET /:videoId - Get Video Details', () => {
    it('should return video details with signed URLs', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock the database chain
      const mockLimit = vi.fn(() => Promise.resolve([mockVideoDetails]));
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockLeftJoin2 = vi.fn(() => ({ where: mockWhere }));
      const mockLeftJoin1 = vi.fn(() => ({ leftJoin: mockLeftJoin2 }));
      const mockFrom = vi.fn(() => ({ leftJoin: mockLeftJoin1 }));
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/jobs/video_1',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.video.id).toBe('video_1');
      // Check that URLs are signed
      expect(body.video.outputUrl).toBe('signed_https://storage.example.com/video.mp4');
      expect(body.video.compressedUrl).toBe('signed_https://storage.example.com/video_compressed.mp4');

      await fastify.close();
    });

    it('should return 404 when video not found', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock empty result
      const mockLimit = vi.fn(() => Promise.resolve([]));
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockLeftJoin2 = vi.fn(() => ({ where: mockWhere }));
      const mockLeftJoin1 = vi.fn(() => ({ leftJoin: mockLeftJoin2 }));
      const mockFrom = vi.fn(() => ({ leftJoin: mockLeftJoin1 }));
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/jobs/nonexistent_video',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Video not found' });

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // POST / - Create Job
  // --------------------------------------------------------------------------
  describe('POST / - Create Job', () => {
    it('should create a video job successfully', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(createVideoJob).mockResolvedValue({
        success: true,
        message: 'Job created successfully',
        seriesId: null,
        videoIds: ['video_new_1'],
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.videoIds).toContain('video_new_1');
      expect(createVideoJob).toHaveBeenCalledWith({
        userId: 'test_user_123',
        body: validSimpleJobPayload,
        isDraft: false,
      });

      await fastify.close();
    });

    it('should create a series job successfully', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(createVideoJob).mockResolvedValue({
        success: true,
        message: 'Job created successfully',
        seriesId: 'series_new_1',
        videoIds: ['video_new_1'],
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: validSeriesJobPayload,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.seriesId).toBe('series_new_1');

      await fastify.close();
    });

    it('should create a draft job when isDraft is true', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(createVideoJob).mockResolvedValue({
        success: true,
        message: 'Draft job created successfully',
        seriesId: null,
        videoIds: ['video_draft_1'],
      });

      const draftPayload = { ...validSimpleJobPayload, isDraft: true };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: draftPayload,
      });

      expect(response.statusCode).toBe(200);
      expect(createVideoJob).toHaveBeenCalledWith({
        userId: 'test_user_123',
        body: draftPayload,
        isDraft: true,
      });

      await fastify.close();
    });

    it('should return 400 for invalid payload', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const invalidPayload = {
        // Missing required fields
        jobType: 'video',
        duration: 1.5,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();

      await fastify.close();
    });

    it('should return 402 for insufficient credits (AppError)', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const appError = new Error('Insufficient credits to generate this video');
      (appError as any).name = 'AppError';
      (appError as any).statusCode = 402;
      (appError as any).key = 'InsuffCredits';

      vi.mocked(createVideoJob).mockRejectedValue(appError);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(402);
      const body = response.json();
      expect(body.key).toBe('InsuffCredits');

      await fastify.close();
    });

    it('should return 500 for generic service errors', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(createVideoJob).mockRejectedValue(new Error('Unexpected error'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Unexpected error' });

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // POST /:videoId/render - Trigger Rendering
  // --------------------------------------------------------------------------
  describe('POST /:videoId/render - Trigger Rendering', () => {
    it('should trigger rendering for a draft video', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(queueVideoRender).mockResolvedValue({
        success: true,
        message: 'Video queued for rendering',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/video_draft_1/render',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);
      expect(queueVideoRender).toHaveBeenCalledWith('video_draft_1', 'test_user_123');

      await fastify.close();
    });

    it('should return 404 when video not found for rendering', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(queueVideoRender).mockRejectedValue(new Error('Video not found'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/nonexistent/render',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Video not found');

      await fastify.close();
    });

    it('should handle AppError for render trigger', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const appError = new Error('Video is already rendering');
      (appError as any).name = 'AppError';
      (appError as any).statusCode = 409;
      (appError as any).key = 'AlreadyRendering';

      vi.mocked(queueVideoRender).mockRejectedValue(appError);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/video_1/render',
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().key).toBe('AlreadyRendering');

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // POST /:videoId/retry - Retry Processing
  // --------------------------------------------------------------------------
  describe('POST /:videoId/retry - Retry Processing', () => {
    it('should retry processing for a failed video', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(retryVideoProcessing).mockResolvedValue({
        success: true,
        message: 'Video processing retried',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/video_failed_1/retry',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);
      expect(retryVideoProcessing).toHaveBeenCalledWith('video_failed_1', 'test_user_123');

      await fastify.close();
    });

    it('should return 404 when video not found for retry', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(retryVideoProcessing).mockRejectedValue(new Error('Video not found'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/nonexistent/retry',
      });

      expect(response.statusCode).toBe(404);

      await fastify.close();
    });

    it('should return 400 when video cannot be retried', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(retryVideoProcessing).mockRejectedValue(new Error('Video is not in a failed state'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/video_1/retry',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Video is not in a failed state');

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // PATCH /:videoId - Update Metadata
  // --------------------------------------------------------------------------
  describe('PATCH /:videoId - Update Metadata', () => {
    it('should update video metadata successfully', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(updateVideoMetadata).mockResolvedValue({
        success: true,
        message: 'Video metadata updated',
      });

      const response = await fastify.inject({
        method: 'PATCH',
        url: '/api/jobs/video_1',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);
      expect(updateVideoMetadata).toHaveBeenCalledWith('video_1', 'test_user_123', validSimpleJobPayload);

      await fastify.close();
    });

    it('should return 400 for invalid metadata update', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      const invalidPayload = {
        jobType: 'video',
        duration: 0.1, // Too short (min is 0.5)
      };

      const response = await fastify.inject({
        method: 'PATCH',
        url: '/api/jobs/video_1',
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');

      await fastify.close();
    });

    it('should return 404 when video not found for update', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(updateVideoMetadata).mockRejectedValue(new Error('Video not found'));

      const response = await fastify.inject({
        method: 'PATCH',
        url: '/api/jobs/nonexistent',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(404);

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /:videoId - Delete Video
  // --------------------------------------------------------------------------
  describe('DELETE /:videoId - Delete Video', () => {
    it('should delete a video successfully', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(deleteVideo).mockResolvedValue({
        success: true,
        message: 'Video deleted successfully',
      });

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/jobs/video_1',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().success).toBe(true);
      expect(deleteVideo).toHaveBeenCalledWith('video_1', 'test_user_123');

      await fastify.close();
    });

    it('should return 404 when video not found for deletion', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(deleteVideo).mockRejectedValue(new Error('Video not found or access denied'));

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/jobs/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().error).toBe('Video not found or access denied');

      await fastify.close();
    });

    it('should return 400 when video has active rendering job', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      vi.mocked(deleteVideo).mockRejectedValue(new Error('Cannot delete this video until the active generation job is finished.'));

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/jobs/video_rendering',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain('Cannot delete');

      await fastify.close();
    });
  });

  // --------------------------------------------------------------------------
  // POST /series/:seriesId/episode - Add Episode to Series
  // --------------------------------------------------------------------------
  describe('POST /series/:seriesId/episode - Add Episode', () => {
    it('should add episode to existing series successfully', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock series lookup
      const mockSeriesLimit = vi.fn(() => Promise.resolve([{ id: 'series_1', name: 'Test Series' }]));
      const mockSeriesWhere = vi.fn(() => ({ limit: mockSeriesLimit }));
      const mockSeriesFrom = vi.fn(() => ({ where: mockSeriesWhere }));
      vi.mocked(db.select).mockReturnValue({ from: mockSeriesFrom } as any);

      vi.mocked(createVideoJob).mockResolvedValue({
        success: true,
        message: 'Episode added successfully',
        seriesId: 'series_1',
        videoIds: ['video_ep_2'],
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/series/series_1/episode',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.seriesId).toBe('series_1');
      expect(createVideoJob).toHaveBeenCalledWith({
        userId: 'test_user_123',
        body: validSimpleJobPayload,
        existingSeriesId: 'series_1',
        isDraft: false,
      });

      await fastify.close();
    });

    it('should return 404 when series not found', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock series not found
      const mockSeriesLimit = vi.fn(() => Promise.resolve([]));
      const mockSeriesWhere = vi.fn(() => ({ limit: mockSeriesLimit }));
      const mockSeriesFrom = vi.fn(() => ({ where: mockSeriesWhere }));
      vi.mocked(db.select).mockReturnValue({ from: mockSeriesFrom } as any);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/series/nonexistent_series/episode',
        payload: validSimpleJobPayload,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Series not found' });

      await fastify.close();
    });

    it('should return 400 for invalid episode payload', async () => {
      const fastify = await createTestFastify();
      fastify.register(jobRoutes, { prefix: '/api/jobs' });
      await fastify.ready();

      // Mock series found
      const mockSeriesLimit = vi.fn(() => Promise.resolve([{ id: 'series_1', name: 'Test Series' }]));
      const mockSeriesWhere = vi.fn(() => ({ limit: mockSeriesLimit }));
      const mockSeriesFrom = vi.fn(() => ({ where: mockSeriesWhere }));
      vi.mocked(db.select).mockReturnValue({ from: mockSeriesFrom } as any);

      const invalidPayload = {
        jobType: 'video',
        // Missing required fields
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/jobs/series/series_1/episode',
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Validation failed');

      await fastify.close();
    });
  });
});
