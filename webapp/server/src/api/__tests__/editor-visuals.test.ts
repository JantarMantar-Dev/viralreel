/**
 * Integration Tests for Editor Visuals API
 *
 * Tests the /api/editor/visuals endpoints with mocked dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestFastify, createUnauthenticatedTestFastify } from '../../test/helpers/fastify.js';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const { mockDb, mockStorageProvider, mockImageProvider } = vi.hoisted(() => {
    return {
        mockDb: {
            select: vi.fn(),
            from: vi.fn(),
            where: vi.fn(),
            limit: vi.fn(),
            update: vi.fn(),
            set: vi.fn(),
        },
        mockStorageProvider: {
            uploadFile: vi.fn(),
            getSignedUrl: vi.fn(),
        },
        mockImageProvider: {
            generateImage: vi.fn(),
        }
    };
});

// ============================================================================
// Mock Dependencies
// ============================================================================

vi.mock('../../db/index.js', () => ({
    db: mockDb
}));

vi.mock('../../lib/storage.js', () => ({
    storageProvider: mockStorageProvider
}));

vi.mock('../../../../shared/image-provider/factory.js', () => ({
    ImageProviderFactory: {
        getProvider: () => mockImageProvider
    }
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Editor Visuals API', () => {
    let fastify: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Setup DB Chain mocks
        mockDb.select.mockReturnThis();
        mockDb.from.mockReturnThis();
        mockDb.where.mockReturnThis();
        // limit returns the final result promise
        mockDb.limit.mockResolvedValue([]); 
        
        mockDb.update.mockReturnThis();
        mockDb.set.mockReturnThis();
        // where after update returns the final result promise
        // mockDb.where is reused, so we need to handle return values carefully or just mock the final chain
        
        // Setup Storage mocks
        mockStorageProvider.uploadFile.mockResolvedValue(undefined);
        mockStorageProvider.getSignedUrl.mockResolvedValue('https://s3.example.com/image.png');

        // Setup Image Provider mock
        mockImageProvider.generateImage.mockResolvedValue(Buffer.from('fake-image-data'));

        // Create test Fastify instance
        fastify = await createTestFastify();

        // Import and register the editor visuals routes
        const editorVisualsRoutes = await import('../editor-visuals.js');
        fastify.register(editorVisualsRoutes.default, { prefix: '/api/editor/visuals' });

        await fastify.ready();
    });

    afterEach(async () => {
        await fastify.close();
    });

    // ==========================================================================
    // POST /generate-segment
    // ==========================================================================

    describe('POST /generate-segment', () => {
        const validPayload = {
            videoId: 'video-123',
            segmentId: 'seg-1',
            prompt: 'A futuristic city',
            style: 'cyberpunk'
        };

        const mockVideo = {
            id: 'video-123',
            userId: 'test_user_123',
            metadata: {
                segments: [
                    { id: 'seg-1', index: 0, imagePrompt: 'old prompt' },
                    { id: 'seg-2', index: 1, imagePrompt: 'another prompt' }
                ],
                visualStyle: 'cinematic',
                aspectRatio: '9:16'
            }
        };

        it('should generate an image and update metadata', async () => {
            // Mock finding the video
            mockDb.limit.mockResolvedValueOnce([mockVideo]);

            const response = await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-segment',
                payload: validPayload
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.success).toBe(true);
            expect(body.segment).toBeDefined();
            expect(body.segment.imageKey).toContain('videos/test_user_123/video-123/images/seg-1.png');
            expect(body.segment.imageUrl).toBe('https://s3.example.com/image.png');
            expect(body.segment.generatedAt).toBeDefined();

            // Verify Image Generation
            expect(mockImageProvider.generateImage).toHaveBeenCalledWith({
                prompt: expect.stringContaining('A futuristic city'),
                style: undefined,
                aspectRatio: '9:16'
            });

            // Verify Storage Upload
            expect(mockStorageProvider.uploadFile).toHaveBeenCalled();
            
            // Verify DB Update
            expect(mockDb.update).toHaveBeenCalled();
            expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
                metadata: expect.objectContaining({
                    segments: expect.arrayContaining([
                        expect.objectContaining({
                            id: 'seg-1',
                            imagePrompt: 'A futuristic city',
                            imageUrl: 'https://s3.example.com/image.png'
                        })
                    ])
                })
            }));
        });

        it('should return 404 if video not found', async () => {
            mockDb.limit.mockResolvedValueOnce([]);

            const response = await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-segment',
                payload: validPayload
            });

            expect(response.statusCode).toBe(404);
            expect(response.json().message).toBe('Video not found or access denied');
        });

        it('should return 404 if segment not found', async () => {
            mockDb.limit.mockResolvedValueOnce([mockVideo]);

            const response = await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-segment',
                payload: { ...validPayload, segmentId: 'non-existent-seg' }
            });

            expect(response.statusCode).toBe(404);
            expect(response.json().message).toBe('Segment not found');
        });

        it('should return 500 if image generation fails', async () => {
            mockDb.limit.mockResolvedValueOnce([mockVideo]);
            mockImageProvider.generateImage.mockRejectedValue(new Error('Generation failed'));

            const response = await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-segment',
                payload: validPayload
            });

            expect(response.statusCode).toBe(500);
            expect(response.json().message).toBe('Generation failed');
        });

        it('should update DB correctly on multiple regenerations', async () => {
            // Mock finding the video
            mockDb.limit.mockResolvedValue([mockVideo]);
            
            // First generation
            await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-segment',
                payload: validPayload
            });

            // Verify first DB update
            expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
                metadata: expect.objectContaining({
                     segments: expect.arrayContaining([
                         expect.objectContaining({
                             id: 'seg-1',
                             imagePrompt: 'A futuristic city'
                         })
                     ])
                })
            }));

            // Second generation with different prompt
            const secondPayload = { ...validPayload, prompt: 'A dark forest' };
            await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-segment',
                payload: secondPayload
            });

            // Verify second DB update reflects new prompt
            expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
                metadata: expect.objectContaining({
                     segments: expect.arrayContaining([
                         expect.objectContaining({
                             id: 'seg-1',
                             imagePrompt: 'A dark forest'
                         })
                     ])
                })
            }));
        });
    });

    // ==========================================================================
    // POST /generate-all
    // ==========================================================================

    describe('POST /generate-all', () => {
        const validPayload = {
            videoId: 'video-123',
            style: 'anime'
        };

        const mockVideo = {
            id: 'video-123',
            userId: 'test_user_123',
            metadata: {
                segments: [
                    { id: 'seg-1', index: 0, imagePrompt: 'prompt 1' },
                    { id: 'seg-2', index: 1, imagePrompt: 'prompt 2' }
                ],
                visualStyle: 'cinematic',
                aspectRatio: '9:16'
            }
        };

        it('should start background generation and update status', async () => {
            mockDb.limit.mockResolvedValue([mockVideo]);

            const response = await fastify.inject({
                method: 'POST',
                url: '/api/editor/visuals/generate-all',
                payload: validPayload
            });

            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.success).toBe(true);
            expect(body.segments).toHaveLength(2);
            
            // Check that segments are marked as generating
            expect(body.segments[0].isGenerating).toBe(true);
            expect(body.segments[1].isGenerating).toBe(true);
            
            // Verify DB updated to GENERATING status
            expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
                metadata: expect.objectContaining({
                    imageGenerationStatus: 'GENERATING',
                    visualStyle: 'anime'
                })
            }));

            // Note: Background process runs asynchronously, so we don't assert completion here
            // unless we add a delay or mock the background execution flow more deeply.
        });
    });
});
