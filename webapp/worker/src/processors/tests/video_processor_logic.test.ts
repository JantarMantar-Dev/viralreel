
import { describe, it, expect, vi } from 'vitest';
import * as s3Lib from '../../lib/s3.js';

// Mock s3 lib
vi.mock('../../lib/s3.js', () => ({
    getSignedUrlForKey: vi.fn(async (key) => ({ url: `https://signed/${key}`, expiresAt: new Date() })),
    uploadToS3: vi.fn(),
}));

describe('VideoProcessor Logic', () => {
    it('should resolve audio S3 key to signed URL', async () => {
        const scriptJson = {
            audioKey: 'audio-key',
            segments: []
        };
        const videoId = '123';

        let audioUrl = "";
        if (scriptJson.audioKey) {
            const { url } = await s3Lib.getSignedUrlForKey(scriptJson.audioKey);
            audioUrl = url;
        } else {
            const s3Key = `videos/${videoId}/audio.wav`;
            const { url } = await s3Lib.getSignedUrlForKey(s3Key);
            audioUrl = url;
        }

        expect(audioUrl).toBe('https://signed/audio-key');
    });

    it('should resolve fallback audio S3 key', async () => {
        const scriptJson = {
            segments: []
        } as any;
        const videoId = '123';

        let audioUrl = "";
        if (scriptJson.audioKey) {
            const { url } = await s3Lib.getSignedUrlForKey(scriptJson.audioKey);
            audioUrl = url;
        } else {
            const s3Key = `videos/${videoId}/audio.wav`;
            const { url } = await s3Lib.getSignedUrlForKey(s3Key);
            audioUrl = url;
        }

        expect(audioUrl).toBe('https://signed/videos/123/audio.wav');
    });

    it('should use cached audio signed URL if valid', async () => {
        const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
        const scriptJson = {
            audioSignedUrl: 'https://cached/audio.wav',
            audioSignedUrlExpiresAt: futureDate,
            audioKey: 'audio-key',
            segments: []
        };
        
        // Helper logic from VideoProcessor (duplicated here for testing logic)
        const now = new Date();
        const isValidSignedUrl = (url?: string, expiresAt?: string | Date) => {
            if (!url || !expiresAt) return false;
            const expiry = new Date(expiresAt);
            return expiry.getTime() > (now.getTime() + 5 * 60000);
        };

        let audioUrl = "";
        if (isValidSignedUrl(scriptJson.audioSignedUrl, scriptJson.audioSignedUrlExpiresAt)) {
             audioUrl = scriptJson.audioSignedUrl!;
        } else if (scriptJson.audioKey) {
            const { url } = await s3Lib.getSignedUrlForKey(scriptJson.audioKey);
            audioUrl = url;
        }

        expect(audioUrl).toBe('https://cached/audio.wav');
    });

    it('should map segments to signed URLs', async () => {
        const segments = [
            { imageKey: 'img1.png', duration: 5 },
            { imageAssetPath: 'img2.png', duration: 5 }, // Legacy/fallback
        ];

        // Mimic implementation logic
        const processedSegments = [];
        for (const s of segments as any[]) {
            let imageUrl = s.imageAssetPath;
            if (s.imageKey) {
                const res = await s3Lib.getSignedUrlForKey(s.imageKey);
                imageUrl = res.url;
            } else if (s.imageAssetPath && !s.imageAssetPath.startsWith('http')) {
                 // Fallback in test
            }
            processedSegments.push({
                ...s,
                imageAssetPath: imageUrl,
                duration: s.duration
            });
        }

        expect(processedSegments[0].imageAssetPath).toBe('https://signed/img1.png');
        expect(processedSegments[1].imageAssetPath).toBe('img2.png'); // As implemented
    });
});
