import { z } from "zod";

/**
 * Base schema with common fields shared between simple mode and editor mode jobs
 */
export const baseVideoJobSchema = z.object({
    nicheId: z.string().nullable(),
    duration: z.number().min(0.5, "Duration must be at least 30 seconds"),
    segments: z.number().int().min(1, "At least 1 segment is required"),
    visualFormat: z.enum(["image", "video"]),
    voiceId: z.string().optional(),
    visualStyle: z.string().optional(),
    subtitleTemplateId: z.string().optional(),
    musicId: z.string().optional(),
    aspectRatio: z.enum(["portrait", "landscape"]).default("portrait"),
    isDraft: z.boolean().default(false),
});

/**
 * Generated script structure for editor mode
 */
export const generatedScriptSchema = z.object({
    story: z.string().min(1, "Story content is required"),
    wordCount: z.number().int().min(1),
    estimatedDurationSeconds: z.number().min(1),
});

// =============================================================================
// SIMPLE MODE SCHEMAS (Original VideoRequest - for quick generation)
// =============================================================================

/**
 * Simple mode job schema - user provides a script idea and the system generates everything
 */
export const simpleJobBaseSchema = baseVideoJobSchema.extend({
    scriptIdea: z.string().min(1, "Script idea is required"),
});

export const createSimpleJobSchema = z.discriminatedUnion("jobType", [
    simpleJobBaseSchema.extend({
        jobType: z.literal("series"),
        seriesName: z.string().min(1, "Series name is required"),
        episodeTitle: z.string().min(1, "Episode title is required"),
    }),
    simpleJobBaseSchema.extend({
        jobType: z.literal("video"),
        seriesName: z.string().optional(),
        episodeTitle: z.string().min(1, "Video title is required"),
    }),
]);

export type CreateSimpleJobBody = z.infer<typeof createSimpleJobSchema>;

// =============================================================================
// EDITOR MODE SCHEMAS (New EditorJobRequest - for advanced control)
// =============================================================================

/**
 * Editor mode job schema - user has full control over script content
 * Script is generated and approved before job creation
 */
export const editorJobBaseSchema = baseVideoJobSchema.extend({
    // Script idea used for generating the script (kept for reference/regeneration)
    scriptIdea: z.string().min(1, "Script idea is required"),
    // The approved script that will be used for video generation
    generatedScript: generatedScriptSchema,
});

export const createEditorJobSchema = z.discriminatedUnion("jobType", [
    editorJobBaseSchema.extend({
        jobType: z.literal("series"),
        seriesName: z.string().min(1, "Series name is required"),
        episodeTitle: z.string().min(1, "Episode title is required"),
    }),
    editorJobBaseSchema.extend({
        jobType: z.literal("video"),
        seriesName: z.string().optional(),
        episodeTitle: z.string().min(1, "Video title is required"),
    }),
]);

export type CreateEditorJobBody = z.infer<typeof createEditorJobSchema>;

// =============================================================================
// COMMON TYPES
// =============================================================================

export type JobType = "video" | "series";
export type VisualFormat = "image" | "video";
export type AspectRatio = "portrait" | "landscape";

// =============================================================================
// UNIFIED RENDER DATA TYPES
// Both auto mode and editor mode populate these fields in video.metadata
// Video processor reads from these fields for rendering
// =============================================================================

/**
 * Subtitle segment for word-level timing
 */
export interface SubtitleSegment {
    text: string;
    start: number; // frames at 30fps
    end: number;   // frames at 30fps
}

/**
 * Render segment - contains all data needed to render a single video segment
 * This is the unified structure used by both auto and editor modes
 */
export interface RenderSegment {
    // Content
    dialogue: string;
    visualPrompt?: string;
    
    // Timing (frames at 30fps)
    start: number;
    end: number;
    duration: number; // seconds
    
    // Image asset - S3 key for the segment image
    imageKey?: string;
    imageSignedUrl?: string;
    imageSignedUrlExpiresAt?: string;
    
    // Effect to apply to the image
    imageEffect?: string;
}

/**
 * Render data structure - unified for both auto and editor modes
 * This is stored in video.metadata.renderData
 */
export interface RenderData {
    // Audio
    audioKey: string;
    audioDurationSeconds: number;
    audioSignedUrl?: string;
    audioSignedUrlExpiresAt?: string;
    
    // Subtitles - word-level timing for captions
    subtitles: SubtitleSegment[];
    
    // Segments - visual segments with timing and images
    segments: RenderSegment[];
    
    // Subtitle Style
    subtitleTemplateId?: string;
    subtitleStyleId?: string;
    
    // Ready flag - set to true when all render data is complete
    isReady: boolean;
}

/**
 * Common metadata structure stored in video.metadata
 */
export interface VideoMetadata {
    duration: number;
    segments: number;
    visualFormat: VisualFormat;
    visualStyle?: string;
    voiceId?: string;
    subtitleTemplateId?: string;
    musicId?: string;
    scriptIdea: string;
    nicheId?: string;
    nicheName?: string;
    aspectRatio: AspectRatio;
    templateId: string;
    
    // =============================================================================
    // UNIFIED RENDER DATA (Used by video processor for both auto and editor modes)
    // =============================================================================
    renderData?: RenderData;
    
    // =============================================================================
    // EDITOR MODE SPECIFIC (For UI state management and version tracking)
    // =============================================================================
    editorMode?: boolean;
    currentPhase?: string;
    
    // Script
    generatedScript?: {
        story: string;
        wordCount: number;
        estimatedDurationSeconds: number;
    };
    approvedScript?: boolean;
    
    // Script version tracking
    scriptVersions?: Array<{
        id: string;
        story: string;
        wordCount: number;
        estimatedDurationSeconds: number;
        feedback?: string;
        generatedAt: string;
    }>;
    scriptGenerationCount?: number;
    lastScriptGeneratedAt?: string;
    
    // Audio version tracking (editor mode allows multiple versions)
    audioKey?: string; // Currently selected audio - also in renderData
    audioDurationSeconds?: number;
    audioVersions?: Array<{
        id: string;
        audioKey: string;
        durationSeconds: number;
        voiceId: string;
        voiceName: string;
        tonePrompt?: string;
        generatedAt: string;
    }>;
    selectedAudioId?: string;
    audioGenerationCount?: number;
    
    // Legacy fields (kept for backward compatibility)
    subtitles?: SubtitleSegment[];
    scriptSegments?: Array<{
        dialogue: string;
        start: number;
        end: number;
        duration: number;
    }>;
}
