import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
            },
        });

        await upload.done();

        // Construct the public URL (assuming Wasabi structure)
        const endpoint = process.env.S3_ENDPOINT_URL?.replace("https://", "") || "s3.wasabisys.com";
        return `https://${this.bucket}.${endpoint}/${key}`;
    }
}

export const storageProvider = new StorageProvider();
