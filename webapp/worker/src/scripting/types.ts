
import { z } from 'zod';

export const ScriptSegmentSchema = z.object({
    dialogue: z.string(),
    visualPrompt: z.string(),
    durationSeconds: z.number(),
});

export const ScriptContentSchema = z.object({
    segments: z.array(ScriptSegmentSchema),
    title: z.string(),
    description: z.string().optional(),
});

export const ScriptWriterOutputSchema = z.object({
    story: z.string(),
});

export const SegmenterOutputSchema = z.object({
    segments: z.array(z.object({
        dialogue: z.string(),
        durationSeconds: z.number(),
    })),
});

export const VisualizerOutputSchema = z.object({
    segments: z.array(z.object({
        dialogue: z.string(),
        visualPrompt: z.string(),
        durationSeconds: z.number(),
    })),
});

export type ScriptWriterOutput = z.infer<typeof ScriptWriterOutputSchema>;
export type SegmenterOutput = z.infer<typeof SegmenterOutputSchema>;
export type VisualizerOutput = z.infer<typeof VisualizerOutputSchema>;

export interface Agent<T> {
    process(input: any): Promise<T>;
}

export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;
export type ScriptContent = z.infer<typeof ScriptContentSchema>;

export interface ScriptingEngine {
    generate(prompt: string, options?: any): Promise<any>;
}

export interface ScriptingJobInterface {
    init(videoId: string): Promise<void>;
    run(): Promise<void>;
}
