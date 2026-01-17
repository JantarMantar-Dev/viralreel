import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageProvider } from './storage.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: vi.fn(),
        GetObjectCommand: vi.fn(),
        PutObjectCommand: vi.fn(),
        DeleteObjectCommand: vi.fn(),
    };
});

vi.mock('@aws-sdk/s3-request-presigner', () => {
    return {
        getSignedUrl: vi.fn(),
    };
});

vi.mock('@aws-sdk/lib-storage', () => {
    return {
        Upload: vi.fn().mockImplementation(() => ({
            done: vi.fn().mockResolvedValue({}),
        })),
    };
});

describe('StorageProvider', () => {
    let storageProvider: StorageProvider;
    
    const mockSignedUrl = 'https://s3.wasabisys.com/bucket/key?signature=xyz';
    
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.S3_BUCKET_NAME = 'test-bucket';
        process.env.S3_ENDPOINT_URL = 'https://s3.wasabisys.com';
        
        storageProvider = new StorageProvider();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getSignedUrl', () => {
        it('should generate a signed URL and cache it', async () => {
            (getSignedUrl as any).mockResolvedValue(mockSignedUrl);

            const url1 = await storageProvider.getSignedUrl('test-key');
            
            expect(getSignedUrl).toHaveBeenCalledTimes(1);
            expect(url1).toBe(mockSignedUrl);

            // Call again, should be cached
            const url2 = await storageProvider.getSignedUrl('test-key');
            expect(getSignedUrl).toHaveBeenCalledTimes(1);
            expect(url2).toBe(mockSignedUrl);
        });

        it('should not cache if expiration is not default', async () => {
            (getSignedUrl as any).mockResolvedValue(mockSignedUrl);

            await storageProvider.getSignedUrl('test-key', 3600);
            await storageProvider.getSignedUrl('test-key', 3600);
            
            expect(getSignedUrl).toHaveBeenCalledTimes(2);
        });
        
        it('should expire cache after timeout', async () => {
            vi.useFakeTimers();
            (getSignedUrl as any).mockResolvedValue(mockSignedUrl);

            await storageProvider.getSignedUrl('test-key');
            expect(getSignedUrl).toHaveBeenCalledTimes(1);

            // Fast forward time past cache expiration (2.5 hours)
            vi.advanceTimersByTime(9000001);

            await storageProvider.getSignedUrl('test-key');
            expect(getSignedUrl).toHaveBeenCalledTimes(2);
        });
    });

    describe('ensureValidSignedUrl', () => {
        it('should treat plain key as key and generate URL', async () => {
             (getSignedUrl as any).mockResolvedValue(mockSignedUrl);
             const result = await storageProvider.ensureValidSignedUrl('my-key.jpg');
             expect(result).toBe(mockSignedUrl);
             expect(getSignedUrl).toHaveBeenCalled();
        });

        it('should extract key from existing signed URL and regenerate', async () => {
             const newSignedUrl = 'https://s3.wasabisys.com/test-bucket/folder/image.png?signature=new';
             (getSignedUrl as any).mockResolvedValue(newSignedUrl);
             
             // Input is an old signed URL
             const oldUrl = 'https://s3.wasabisys.com/test-bucket/folder/image.png?signature=old';
             
             const result = await storageProvider.ensureValidSignedUrl(oldUrl);
             
             expect(result).toBe(newSignedUrl);
             // Verify key extraction
             // The key should be 'folder/image.png'
             // We can check if getSignedUrl was called (it would be called by the internal logic)
             expect(getSignedUrl).toHaveBeenCalled();
        });

        it('should return original URL if it does not match bucket', async () => {
            const externalUrl = 'https://google.com/image.png';
            const result = await storageProvider.ensureValidSignedUrl(externalUrl);
            expect(result).toBe(externalUrl);
            expect(getSignedUrl).not.toHaveBeenCalled();
        });
        
         it('should return original URL if it does not match bucket in path', async () => {
            const otherBucketUrl = 'https://s3.wasabisys.com/other-bucket/image.png';
            const result = await storageProvider.ensureValidSignedUrl(otherBucketUrl);
            expect(result).toBe(otherBucketUrl);
            expect(getSignedUrl).not.toHaveBeenCalled();
        });

        it('should handle null/empty input', async () => {
            const result = await storageProvider.ensureValidSignedUrl('');
            expect(result).toBe('');
        });
    });
});
