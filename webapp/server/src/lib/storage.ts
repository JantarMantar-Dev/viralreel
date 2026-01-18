import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";

dotenv.config();

/**
 * StorageProvider
 * Handles file uploads to S3-compatible storage (Wasabi).
 */
export class StorageProvider {
    private client: S3Client;
    private bucket: string;
    private signedUrlCache: Map<string, string>;

    constructor() {
        this.client = new S3Client({
            endpoint: process.env.S3_ENDPOINT_URL || "https://s3.wasabisys.com",
            region: process.env.S3_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: true, // Fix for Docker DNS resolution issues with virtual-hosted-style URLs
        });
        this.bucket = process.env.S3_BUCKET_NAME || "";
        this.signedUrlCache = new Map();
    }

    /**
     * Uploads a file buffer or stream to the specified key.
     */
    async uploadFile(file: Buffer | ReadableStream | string, key: string, contentType: string): Promise<string> {
        if (!this.bucket) {
            throw new Error("S3_BUCKET_NAME is not configured");
        }

        const upload = new Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: contentType,
                // ACL removed as it causes 403 Forbidden on buckets with public access restrictions
            },
        });

        await upload.done();

        // Invalidate cache for this key so next getSignedUrl returns a fresh URL
        this.signedUrlCache.delete(key);

        // Return the key directly for storage, or constructed URL if needed by legacy
        // For now, we return the URL structure, but we will mostly rely on key extraction or signed URLs
        const endpoint = process.env.S3_ENDPOINT_URL?.replace("https://", "") || "s3.wasabisys.com";
        return `https://${endpoint}/${this.bucket}/${key}`;
    }

    async deleteFile(key: string): Promise<void> {
        if (!this.bucket) {
            throw new Error("S3_BUCKET_NAME is not configured");
        }

        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        await this.client.send(command);
    }

    /**
     * Downloads a file from S3 and returns it as a Buffer.
     * @param key The S3 object key
     */
    async downloadFile(key: string): Promise<Buffer> {
        if (!this.bucket) {
            throw new Error("S3_BUCKET_NAME is not configured");
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        const response = await this.client.send(command);

        if (!response.Body) {
            throw new Error(`File not found: ${key}`);
        }

        // Convert the readable stream to a buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    /**
     * Generates a signed URL for reading a file.
     * @param key The S3 object key
     * @param expiresInSeconds Expiration time in seconds (default 3 hours)
     */
    async getSignedUrl(key: string, expiresInSeconds = 10800): Promise<string> {
        if (!this.bucket) {
            throw new Error("S3_BUCKET_NAME is not configured");
        }

        // Check if we have a valid cached URL for this key
        // Only use cache if using the default expiration (3 hours), as that matches our cache policy
        if (expiresInSeconds === 10800 && this.signedUrlCache.has(key)) {
            return this.signedUrlCache.get(key)!;
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        const signedUrl = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });

        // Cache the URL if using the standard 3-hour expiration
        if (expiresInSeconds === 10800) {
            this.signedUrlCache.set(key, signedUrl);

            // Expire cache after 2.5 hours (2 hours 30 mins = 9,000,000 ms)
            // This ensures we refresh the URL before it actually expires (3 hours)
            setTimeout(() => {
                this.signedUrlCache.delete(key);
            }, 2.5 * 60 * 60 * 1000);
        }

        return signedUrl;
    }

    /**
     * Ensures we have a valid signed URL.
     * If input is a key (not a URL), generates a signed URL.
     * If input is a URL from our bucket (signed or not), regenerates a fresh signed URL.
     * If input is an external URL, returns it as is.
     */
    async ensureValidSignedUrl(input: string, expiresInSeconds = 10800): Promise<string> {
        if (!input) return input;

        try {
            const urlObj = new URL(input);
            
            // Check if it belongs to our bucket (Path style: /bucket/key)
            const pathParts = urlObj.pathname.split('/');
            // pathParts[0] is "", pathParts[1] is bucket
            
            if (pathParts[1] === this.bucket) {
                const key = pathParts.slice(2).join('/');
                if (key) {
                    return await this.getSignedUrl(key, expiresInSeconds);
                }
            }
            
            // Return external URLs as is
            return input;
        } catch (e) {
            // Not a URL, treat as key
            return await this.getSignedUrl(input, expiresInSeconds);
        }
    }

    /**
     * Extracts key from full URL and returns signed URL.
     * If URL is not from this bucket, returns original URL.
     */
    async getSignedUrlFromFullUrl(fullUrl: string): Promise<string> {
        return this.ensureValidSignedUrl(fullUrl);
    }
}

export const storageProvider = new StorageProvider();
