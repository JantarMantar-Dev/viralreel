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
     * Generates a signed URL for reading a file.
     * @param key The S3 object key
     * @param expiresInSeconds Expiration time in seconds (default 1 hour)
     */
    async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        if (!this.bucket) {
            throw new Error("S3_BUCKET_NAME is not configured");
        }

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    }
}

export const storageProvider = new StorageProvider();
