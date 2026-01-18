
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT_URL,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true
});

export async function uploadToS3(filePath: string, key: string, contentType?: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: contentType || 'application/octet-stream',
        ACL: 'public-read', // Check if this is desired
    };

    try {
        await s3.send(new PutObjectCommand(uploadParams as any));
        const endpoint = process.env.S3_ENDPOINT_URL || '';
        const bucket = process.env.S3_BUCKET_NAME || '';
        // Return a clean URL or just the key? 
        // Returning the key is often better if we want to sign it later.
        // But the existing code expected a URL. 
        // Let's return the public URL if possible, but for internal logic we might want the key.
        return `${endpoint}/${bucket}/${key}`;
    } catch (err) {
        console.error("S3 Upload Error:", err);
        throw err;
    }
}

export async function getSignedUrlForKey(key: string, expiresIn = 3600): Promise<{ url: string, expiresAt: Date }> {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn });
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));
    return { url, expiresAt };
}

export function getS3Client() {
    return s3;
}
