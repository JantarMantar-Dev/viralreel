
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set environment variable before importing modules that might check it
process.env.DATABASE_URL = 'postgres://dummy:dummy@localhost:5432/dummy';
process.env.VIDEO_WORK_DIR = '/tmp/work_dir';

// Mock DB before importing the processor
vi.mock('../../db/index.js', () => ({
    db: {
        query: {
            video: { findFirst: vi.fn() },
            script: { findFirst: vi.fn() },
            subtitleStyle: { findFirst: vi.fn() }
        },
        transaction: vi.fn((cb) => cb({
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            for: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
        })),
        update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
        })),
    }
}));

vi.mock('../../lib/s3.js', () => ({
    getSignedUrlForKey: vi.fn(),
    uploadToS3: vi.fn().mockResolvedValue('http://mock-url.com/file.mp4'),
}));

vi.mock('@remotion/bundler', () => ({
    bundle: vi.fn().mockResolvedValue('/tmp/bundle'),
}));

vi.mock('@remotion/renderer', () => ({
    renderMedia: vi.fn(),
    selectComposition: vi.fn().mockResolvedValue({}),
    ensureBrowser: vi.fn(),
}));

vi.mock('../../lib/video.js', () => ({
    compressVideo: vi.fn(),
}));

vi.mock('../../services/credit-service.js', () => ({
    deductCredits: vi.fn(),
}));

// Now import the processor
import { VideoProcessor } from '../video-processor.js';
import { db } from '../../db/index.js';
import * as s3 from '../../lib/s3.js';

describe('VideoProcessor Render Schema Tests', () => {
    let processor: VideoProcessor;

    beforeEach(() => {
        processor = new VideoProcessor();
        vi.clearAllMocks();
    });

    it('should use unified RenderData from video.metadata when present (Auto/Editor Mode)', async () => {
        // Setup mock data
        const mockJob = { id: 'job-1', videoId: 'video-1' };
        
        const mockRenderData = {
            audioKey: 'videos/video-1/audio.wav',
            audioDurationSeconds: 10,
            subtitles: [{ text: 'Hello', start: 0, end: 30 }],
            segments: [
                { 
                    imageKey: 'videos/video-1/segment_0.png',
                    duration: 5,
                    imageEffect: 'zoom'
                }
            ],
            isReady: true
        };

        const mockVideo = {
            id: 'video-1',
            userId: 'user-1',
            metadata: {
                renderData: mockRenderData,
                aspectRatio: 'portrait'
            }
        };

        // Mock DB responses
        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(null); // No script record needed for unified schema
        
        // Mock S3 signing
        (s3.getSignedUrlForKey as any).mockImplementation((key: string) => 
            Promise.resolve({ url: `http://signed/${key}`, expiresAt: new Date(Date.now() + 3600000) })
        );

        // Run process
        await processor.process(mockJob as any);

        // Verify S3 signing was called for renderData keys
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('videos/video-1/audio.wav');
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('videos/video-1/segment_0.png');
    });

    it('should fallback to legacy script content if RenderData is missing', async () => {
        const mockJob = { id: 'job-2', videoId: 'video-2' };
        
        const mockVideo = {
            id: 'video-2',
            userId: 'user-2',
            metadata: {
                // No renderData
                aspectRatio: 'landscape'
            }
        };

        const mockScript = {
            content: {
                audioKey: 'videos/video-2/legacy-audio.wav',
                segments: [
                    { 
                        imageKey: 'videos/video-2/legacy-image.png',
                        duration: 5 
                    }
                ],
                subtitles: []
            }
        };

        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(mockScript);
        
        (s3.getSignedUrlForKey as any).mockImplementation((key: string) => 
            Promise.resolve({ url: `http://signed/${key}`, expiresAt: new Date(Date.now() + 3600000) })
        );

        await processor.process(mockJob as any);

        // Verify legacy keys were signed
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('videos/video-2/legacy-audio.wav');
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('videos/video-2/legacy-image.png');
    });

    it('should handle legacy Editor Mode (audioKey in metadata root)', async () => {
        const mockJob = { id: 'job-3', videoId: 'video-3' };
        
        const mockVideo = {
            id: 'video-3',
            userId: 'user-3',
            metadata: {
                editorMode: true,
                audioKey: 'videos/user-3/video-3/audio_123.wav', // Editor audio key
                // No renderData
            }
        };

        const mockScript = {
            content: {
                // Missing audioKey in script (common issue in legacy editor videos)
                segments: [],
                subtitles: []
            }
        };

        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(mockScript);
        
        (s3.getSignedUrlForKey as any).mockImplementation((key: string) => 
            Promise.resolve({ url: `http://signed/${key}`, expiresAt: new Date(Date.now() + 3600000) })
        );

        await processor.process(mockJob as any);

        // Verify it picked up the audioKey from metadata root
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('videos/user-3/video-3/audio_123.wav');
    });

    it('should use pre-signed URLs from RenderData if valid', async () => {
        const mockJob = { id: 'job-4', videoId: 'video-4' };
        
        const validExpiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour future
        
        const mockRenderData = {
            audioKey: 'videos/video-4/audio.wav',
            audioDurationSeconds: 10,
            audioSignedUrl: 'http://pre-signed/audio.wav',
            audioSignedUrlExpiresAt: validExpiresAt,
            subtitles: [],
            segments: [],
            isReady: true
        };

        const mockVideo = {
            id: 'video-4',
            userId: 'user-4',
            metadata: {
                renderData: mockRenderData,
            }
        };

        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(null);

        await processor.process(mockJob as any);

        // Should NOT call getSignedUrlForKey because we have a valid cached URL
        expect(s3.getSignedUrlForKey).not.toHaveBeenCalledWith('videos/video-4/audio.wav');
    });

    it('should refresh expired signed URLs in RenderData and update DB', async () => {
        const mockJob = { id: 'job-5', videoId: 'video-5' };
        
        const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour past
        
        const mockRenderData = {
            audioKey: 'videos/video-5/audio.wav',
            audioDurationSeconds: 10,
            audioSignedUrl: 'http://expired/audio.wav',
            audioSignedUrlExpiresAt: expiredDate,
            subtitles: [],
            segments: [],
            isReady: true
        };

        const mockVideo = {
            id: 'video-5',
            userId: 'user-5',
            metadata: {
                renderData: mockRenderData,
            }
        };

        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(null);
        
        (s3.getSignedUrlForKey as any).mockResolvedValue({ 
            url: 'http://new-signed/audio.wav', 
            expiresAt: new Date(Date.now() + 3600000) 
        });

        await processor.process(mockJob as any);

        // Should call getSignedUrlForKey because cache is expired
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('videos/video-5/audio.wav');
        
        // Verify DB update was called to cache the new URL
        expect(db.update).toHaveBeenCalled();
    });

    it('should handle missing audioKey gracefully (not crash)', async () => {
        const mockJob = { id: 'job-6', videoId: 'video-6' };
        
        const mockRenderData = {
            audioKey: '', // Missing
            audioDurationSeconds: 0,
            subtitles: [],
            segments: [],
            isReady: true
        };

        const mockVideo = {
            id: 'video-6',
            userId: 'user-6',
            metadata: {
                renderData: mockRenderData,
            }
        };

        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(null);

        await processor.process(mockJob as any);

        // Should not call s3 for empty key
        expect(s3.getSignedUrlForKey).not.toHaveBeenCalled();
    });

    it('should sign image keys in RenderData segments', async () => {
        const mockJob = { id: 'job-7', videoId: 'video-7' };
        
        const mockRenderData = {
            audioKey: 'audio.wav',
            audioDurationSeconds: 10,
            subtitles: [],
            segments: [
                {
                    imageKey: 'segment_1.png',
                    duration: 5
                },
                {
                    imageAssetPath: 'http://already-signed.com/img.png', // Should be skipped
                    duration: 5
                }
            ],
            isReady: true
        };

        const mockVideo = {
            id: 'video-7',
            userId: 'user-7',
            metadata: { renderData: mockRenderData }
        };

        (db.query.video.findFirst as any).mockResolvedValue(mockVideo);
        (db.query.script.findFirst as any).mockResolvedValue(null);

        await processor.process(mockJob as any);

        // Should sign the S3 key
        expect(s3.getSignedUrlForKey).toHaveBeenCalledWith('segment_1.png');
        // Should NOT sign the http URL
        expect(s3.getSignedUrlForKey).not.toHaveBeenCalledWith('http://already-signed.com/img.png');
    });

});
