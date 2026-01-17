import { db } from "../db/index.js";
import { video, script as scriptSchema } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { storageProvider } from "../lib/storage.js";
import { AppError } from "../lib/errors.js";
import { v4 as uuidv4 } from "uuid";
import { ImageProviderFactory } from "../../../shared/image-provider/factory.js";
import { IMAGE_STYLES as SHARED_STYLES } from "../../../shared/image-provider/types.js";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Use the same model as the worker for consistent results
// const IMAGE_MODEL = process.env.GOOGLE_IMAGE_MODEL || 'gemini-3-pro-image-preview'; // Moved to provider
const SCRIPT_MODEL = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';

// =============================================================================
// TYPES
// =============================================================================

export interface VisualSegment {
    id: string;
    index: number;
    timeRange: [number, number]; // [start, end] in seconds
    subtitleText: string;
    imagePrompt: string;
    imageKey?: string;
    imageUrl?: string;
    generatedAt?: string;
}

export interface AnalyzeVisualsParams {
    videoId: string;
    userId: string;
    segments: any[];
}

export interface GenerateSegmentImageParams {
    videoId: string;
    userId: string;
    segmentId: string;
    prompt: string;
    style?: string;
}

export interface GenerateAllImagesParams {
    videoId: string;
    userId: string;
    style?: string;
}

// Visual Style Definitions (matching worker)
export const IMAGE_STYLES: Record<string, string> = SHARED_STYLES;

// =============================================================================
// SCRIPT ANALYSIS (LLM-based segmentation)
// =============================================================================

async function generatePromptsForExistingSegments(segments: any[]): Promise<{ segments: Omit<VisualSegment, 'id'>[] }> {
    if (!GOOGLE_API_KEY) {
        throw new AppError("ConfigError", "GOOGLE_API_KEY not configured", 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

    // Prepare segments context (simplified)
    const segmentsContext = segments.map(s => ({
        index: s.index,
        subtitleText: s.subtitleText
    }));

    const prompt = `You are a visual director for AI video generation.

Here is a list of segments with their subtitle text. Your task is to generate a detailed 'imagePrompt' for EACH segment based on its text.
Do NOT add, remove, or re-order segments. Strictly output the same segments with the added 'imagePrompt'.

SEGMENTS:
${JSON.stringify(segmentsContext, null, 2)}

For each segment, provide a detailed visual prompt describing the scene to generate as an image.
- Visual prompts are detailed, cinematic, and describe specific scenes matching the dialogue/narration.
- Visual prompts should be suitable for AI image generation.

Return a JSON object with this structure:
{
  "segments": [
    {
      "index": 0,
      "imagePrompt": "A detailed description..."
    }
  ]
}

Return ONLY the JSON object.`;

    console.log(`[EditorVisualService] Generating prompts for ${segments.length} existing segments`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[EditorVisualService] LLM API Error:`, errText);
        throw new AppError("LLMError", `Prompt generation failed: ${response.status}`, 500);
    }

    const data = await response.json();

    const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
    if (!textPart?.text) {
        throw new AppError("LLMError", "No response from LLM", 500);
    }

    let jsonText = textPart.text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
    }

    try {
        const parsed = JSON.parse(jsonText.trim());

        // Validation: Ensure count matches
        if (parsed.segments.length !== segments.length) {
            console.warn(`[EditorVisualService] Mismatch in segment count. Input: ${segments.length}, Output: ${parsed.segments.length}. Attempting to align.`);
            // Fallback: Use output prompts if indices match, otherwise careful
        }

        return parsed;
    } catch (e) {
        console.error(`[EditorVisualService] Failed to parse LLM response:`, jsonText);
        throw new AppError("LLMError", "Failed to parse prompt generation", 500);
    }
}

// =============================================================================
// IMAGE GENERATION
// =============================================================================

async function generateImage(prompt: string, style?: string, aspectRatio: string = "9:16"): Promise<Buffer> {
    try {
        const provider = ImageProviderFactory.getProvider();
        return await provider.generateImage({
            prompt,
            style,
            aspectRatio
        });
    } catch (error: any) {
        console.error(`[EditorVisualService] Image generation failed:`, error);
        throw new AppError("ImageError", error.message || "Image generation failed", 500);
    }
}

// =============================================================================
// MAIN SERVICE FUNCTIONS
// =============================================================================

/**
 * Analyze script and generate visual segments
 */
export async function analyzeVisuals(params: AnalyzeVisualsParams): Promise<{ segments: VisualSegment[] }> {
    const { videoId, userId, segments: inputSegments } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    // 2. Analyze script with LLM (Generate prompts for existing segments)
    const analysis = await generatePromptsForExistingSegments(inputSegments);

    // 3. Construct final segments
    const segments: VisualSegment[] = [];

    // Strict alignment with input segments
    for (const inputSeg of inputSegments) {
        // Find corresponding generated segment
        const genSeg = analysis.segments.find(s => s.index === inputSeg.index) || analysis.segments[inputSeg.index];

        segments.push({
            ...inputSeg, // Preserve original data (id, timing, subtitle)
            imagePrompt: genSeg?.imagePrompt || "Cinematic scene matching the dialogue",
            // Ensure ID exists
            id: inputSeg.id || uuidv4(),
        });
    }

    // 4. Update video metadata
    const currentMetadata = (existingVideo[0].metadata as any) || {};
    const updatedMetadata = {
        ...currentMetadata,
        editorMode: true,
        currentPhase: "visuals",
        segments,
    };

    await db.update(video)
        .set({
            metadata: updatedMetadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    return { segments };
}

/**
 * Generate image for a single segment
 */
export async function generateSegmentImage(params: GenerateSegmentImageParams): Promise<{ segment: VisualSegment }> {
    const { videoId, userId, segmentId, prompt, style } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    const metadata = existingVideo[0].metadata as any;
    if (!metadata?.segments) {
        throw new AppError("BadRequest", "No segments found - run analyze first", 400);
    }

    // 2. Find the segment
    const segmentIndex = metadata.segments.findIndex((s: any) => s.id === segmentId);
    if (segmentIndex === -1) {
        throw new AppError("NotFound", "Segment not found", 404);
    }

    // 3. Generate image
    const imageBuffer = await generateImage(
        prompt,
        style || metadata.visualStyle,
        metadata.aspectRatio || "portrait" // Default to portrait if not set
    );

    // 4. Upload to S3
    const imageKey = `videos/${userId}/${videoId}/images/${segmentId}.png`;
    await storageProvider.uploadFile(imageBuffer, imageKey, 'image/png');
    console.log(`[EditorVisualService] Uploaded image to S3: ${imageKey}`);

    // 5. Get signed URL
    const imageUrl = await storageProvider.getSignedUrl(imageKey);

    // 6. Update segment in metadata
    const updatedSegments = [...metadata.segments];
    updatedSegments[segmentIndex] = {
        ...updatedSegments[segmentIndex],
        imagePrompt: prompt,
        imageKey,
        imageUrl,
        generatedAt: new Date().toISOString(),
    };

    await db.update(video)
        .set({
            metadata: { ...metadata, segments: updatedSegments },
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    return { segment: updatedSegments[segmentIndex] };
}

/**
 * Generate images for all segments
 */
export async function generateAllImages(params: GenerateAllImagesParams): Promise<{ segments: VisualSegment[] }> {
    const { videoId, userId, style } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    const metadata = existingVideo[0].metadata as any;
    if (!metadata?.segments || metadata.segments.length === 0) {
        throw new AppError("BadRequest", "No segments found - run analyze first", 400);
    }

    const visualStyle = style || metadata.visualStyle;
    const updatedSegments: VisualSegment[] = [];

    // 2. Generate images for each segment (sequentially to avoid rate limits)
    for (const segment of metadata.segments) {
        try {
            console.log(`[EditorVisualService] Generating image for segment ${segment.index + 1}/${metadata.segments.length}`);

            const imageBuffer = await generateImage(
                segment.imagePrompt,
                visualStyle,
                metadata.aspectRatio || "portrait" // Default to portrait if not set
            );

            // Upload to S3
            const imageKey = `videos/${userId}/${videoId}/images/${segment.id}.png`;
            await storageProvider.uploadFile(imageBuffer, imageKey, 'image/png');

            // Get signed URL
            const imageUrl = await storageProvider.getSignedUrl(imageKey);

            updatedSegments.push({
                ...segment,
                imageKey,
                imageUrl,
                generatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error(`[EditorVisualService] Failed to generate image for segment ${segment.id}:`, error);
            // Continue with other segments, keep the original without image
            updatedSegments.push(segment);
        }
    }

    // 3. Update video metadata
    await db.update(video)
        .set({
            metadata: { ...metadata, segments: updatedSegments, visualStyle },
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    return { segments: updatedSegments };
}

/**
 * Update segment prompt (without regenerating image)
 */
export async function updateSegmentPrompt(
    videoId: string,
    userId: string,
    segmentId: string,
    newPrompt: string
): Promise<{ segment: VisualSegment }> {
    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    const metadata = existingVideo[0].metadata as any;
    if (!metadata?.segments) {
        throw new AppError("BadRequest", "No segments found", 400);
    }

    // 2. Find and update the segment
    const segmentIndex = metadata.segments.findIndex((s: any) => s.id === segmentId);
    if (segmentIndex === -1) {
        throw new AppError("NotFound", "Segment not found", 404);
    }

    const updatedSegments = [...metadata.segments];
    updatedSegments[segmentIndex] = {
        ...updatedSegments[segmentIndex],
        imagePrompt: newPrompt,
    };

    // 3. Update video metadata
    await db.update(video)
        .set({
            metadata: { ...metadata, segments: updatedSegments },
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    return { segment: updatedSegments[segmentIndex] };
}
