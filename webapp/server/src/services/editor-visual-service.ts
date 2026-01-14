import { db } from "../db/index.js";
import { video } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { storageProvider } from "../lib/storage.js";
import { AppError } from "../lib/errors.js";
import { v4 as uuidv4 } from "uuid";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const IMAGE_MODEL = process.env.GOOGLE_IMAGE_MODEL || 'gemini-2.0-flash-exp';
const SCRIPT_MODEL = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-2.0-flash';

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
    script: string;
    audioDurationSeconds: number;
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
export const IMAGE_STYLES: Record<string, string> = {
    "comic": "Bold comic-book style, thick outlines",
    "creepy comic": "Horror-comic style, exaggerated shades",
    "painting": "Detailed traditional painting style",
    "ghibli": "Studio Ghibli-inspired, soft colors",
    "anime": "Clean anime style, sharp linework",
    "dark fantasy": "Moody atmosphere, dark colors",
    "lego": "Plastic texture, LEGO figure style",
    "polaroid": "Vintage Polaroid style, soft glow",
    "disney": "Classic animation style, soft curves",
    "realism": "Ultra-realistic photographic style",
    "fantastic": "Vibrant magical fantasy style"
};

// =============================================================================
// SCRIPT ANALYSIS (LLM-based segmentation)
// =============================================================================

async function analyzeScriptWithLLM(script: string, audioDurationSeconds: number): Promise<{ segments: Omit<VisualSegment, 'id'>[] }> {
    if (!GOOGLE_API_KEY) {
        throw new AppError("ConfigError", "GOOGLE_API_KEY not configured", 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

    // Calculate target segment count based on duration
    const targetSegments = Math.max(3, Math.min(10, Math.ceil(audioDurationSeconds / 6)));

    const prompt = `You are a visual director for AI video generation.

Analyze this script and split it into ${targetSegments} visual segments for a ${audioDurationSeconds.toFixed(1)} second video.

SCRIPT:
"""
${script}
"""

For each segment, provide:
1. The subtitle text (the dialogue/narration for that segment)
2. A detailed visual prompt describing the scene to generate as an image
3. The time range in seconds [start, end]

Make sure:
- Segments cover the entire duration (0 to ${audioDurationSeconds.toFixed(1)} seconds)
- Visual prompts are detailed, cinematic, and describe specific scenes
- Each segment flows naturally into the next
- Visual prompts should be suitable for AI image generation

Return a JSON object with this structure:
{
  "segments": [
    {
      "index": 0,
      "timeRange": [0, 5.5],
      "subtitleText": "The narrative text for this segment...",
      "imagePrompt": "A detailed description of the visual scene..."
    }
  ]
}

Return ONLY the JSON object, no other text.`;

    console.log(`[EditorVisualService] Analyzing script with LLM, targeting ${targetSegments} segments`);

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
        throw new AppError("LLMError", `Script analysis failed: ${response.status}`, 500);
    }

    const data = await response.json();

    // Extract text response
    const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
    if (!textPart?.text) {
        throw new AppError("LLMError", "No response from LLM", 500);
    }

    // Parse JSON from response (handle markdown code blocks)
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
        console.log(`[EditorVisualService] Generated ${parsed.segments.length} segments`);
        return parsed;
    } catch (e) {
        console.error(`[EditorVisualService] Failed to parse LLM response:`, jsonText);
        throw new AppError("LLMError", "Failed to parse segment analysis", 500);
    }
}

// =============================================================================
// IMAGE GENERATION (Gemini)
// =============================================================================

async function generateImage(prompt: string, style?: string, aspectRatio: string = "9:16"): Promise<Buffer> {
    if (!GOOGLE_API_KEY) {
        throw new AppError("ConfigError", "GOOGLE_API_KEY not configured", 500);
    }

    // Append style if provided
    let styledPrompt = prompt;
    if (style) {
        const normalizedStyle = style.toLowerCase().replace(/-/g, ' ');
        if (IMAGE_STYLES[normalizedStyle]) {
            styledPrompt = `${prompt} Style: ${IMAGE_STYLES[normalizedStyle]}.`;
        }
    }

    // Append aspect ratio
    const augmentedPrompt = `${styledPrompt} --aspect_ratio ${aspectRatio}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GOOGLE_API_KEY}`;

    console.log(`[EditorVisualService] Generating image: "${prompt.substring(0, 50)}..."`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: augmentedPrompt }] }],
            generationConfig: {
                candidateCount: 1,
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[EditorVisualService] Image API Error:`, errText);
        throw new AppError("ImageError", `Image generation failed: ${response.status}`, 500);
    }

    const data = await response.json();

    // Find image data in response
    const parts = data.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p: any) => p.inlineData || p.inline_data);

    if (!imagePart) {
        // Check if model returned text instead
        const textPart = parts?.find((p: any) => p.text);
        if (textPart) {
            console.error(`[EditorVisualService] Model returned text instead of image:`, textPart.text.substring(0, 100));
        }
        throw new AppError("ImageError", "No image data in response", 500);
    }

    const imageBase64 = (imagePart.inlineData || imagePart.inline_data).data;
    return Buffer.from(imageBase64, 'base64');
}

// =============================================================================
// MAIN SERVICE FUNCTIONS
// =============================================================================

/**
 * Analyze script and generate visual segments
 */
export async function analyzeVisuals(params: AnalyzeVisualsParams): Promise<{ segments: VisualSegment[] }> {
    const { videoId, userId, script, audioDurationSeconds } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    // 2. Analyze script with LLM
    const analysis = await analyzeScriptWithLLM(script, audioDurationSeconds);

    // 3. Add IDs to segments
    const segments: VisualSegment[] = analysis.segments.map((seg, idx) => ({
        ...seg,
        id: uuidv4(),
        index: idx,
    }));

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
    const imageBuffer = await generateImage(prompt, style || metadata.visualStyle);

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
            
            const imageBuffer = await generateImage(segment.imagePrompt, visualStyle);

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
