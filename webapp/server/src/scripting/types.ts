import { z } from 'zod';

export const ScriptSegmentSchema = z.object({
    dialogue: z.string(),
    visualPrompt: z.string(),
    duration: z.number(),
    start: z.number().optional(),
    end: z.number().optional(),
});

export const SubtitleWordSchema = z.object({
    text: z.string(),
    start: z.number(),
    end: z.number(),
});

export const SubtitlesOutputSchema = z.object({
    subtitles: z.array(SubtitleWordSchema),
});

export const ScriptContentSchema = z.object({
    segments: z.array(ScriptSegmentSchema),
    title: z.string(),
    description: z.string().optional(),
    subtitles: z.array(SubtitleWordSchema).optional(),
});

export const ScriptWriterOutputSchema = z.object({
    story: z.string(),
});

export const SegmenterOutputSchema = z.object({
    segments: z.array(z.object({
        dialogue: z.string(),
        duration: z.number().optional(),
        start: z.number(),
        end: z.number(),
    })),
});

export const VisualizerOutputSchema = z.object({
    segments: z.array(z.object({
        dialogue: z.string(),
        visualPrompt: z.string(),
        duration: z.number(),
    })),
});

export type ScriptWriterOutput = z.infer<typeof ScriptWriterOutputSchema>;
export type SegmenterOutput = z.infer<typeof SegmenterOutputSchema>;
export type VisualizerOutput = z.infer<typeof VisualizerOutputSchema>;
export type SubtitlesOutput = z.infer<typeof SubtitlesOutputSchema>;
export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;
export type SubtitleWord = z.infer<typeof SubtitleWordSchema>;
export type ScriptContent = z.infer<typeof ScriptContentSchema>;

export interface GenerateScriptOptions {
    scriptIdea: string;
    nicheName?: string;
    duration: number; // in minutes
    voiceId: string;
    videoId?: string; // optional, for file saving
    feedback?: string; // user feedback for regeneration
    previousScript?: string; // previous generated script for context
}

export interface GenerateScriptResult {
    script: ScriptContent;
    audioBase64?: string;
}
