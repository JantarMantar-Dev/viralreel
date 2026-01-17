
import { describe, it, expect, vi } from 'vitest';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => {
    const S3Client = vi.fn();
    S3Client.prototype.send = vi.fn();
    return {
        S3Client,
        PutObjectCommand: vi.fn(),
        GetObjectCommand: vi.fn(),
    };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn().mockResolvedValue('https://mock-signed-url.com'),
}));

// Mock fs
vi.mock('fs', () => ({
    default: {
        createReadStream: vi.fn().mockReturnValue('mock-stream'),
    },
}));

// Import AFTER mocking
import { getSignedUrlForKey, uploadToS3, getS3Client } from '../s3.js';

describe('S3 Lib', () => {
    it('should get a signed URL', async () => {
        const { url, expiresAt } = await getSignedUrlForKey('test-key');
        expect(url).toBe('https://mock-signed-url.com');
        expect(expiresAt).toBeInstanceOf(Date);
        expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should upload to S3', async () => {
        const s3 = getS3Client();
        await uploadToS3('/path/to/file', 'key', 'video/mp4');
        expect(s3.send).toHaveBeenCalled();
        expect(PutObjectCommand).toHaveBeenCalled();
    });
});
