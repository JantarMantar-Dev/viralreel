
import { db } from '../db/index.js';
import { video, contentNiche, script } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ScriptingJobInterface, ScriptContent } from './types.js';
import { runContentPipeline, runContentPipelineFromStory } from './agents.js';
import { resolveWorkDir, writeToFile, addWavHeader } from './utils.js';
import { nanoid } from 'nanoid';

/**
 * Converts ScriptContent to RenderData format for video.metadata
 * This ensures both auto mode and editor mode have the same render data structure
 */
function buildRenderData(scriptContent: ScriptContent): {
    audioKey: string;
    audioDurationSeconds: number;
    subtitles: Array<{ text: string; start: number; end: number }>;
    segments: Array<{
        dialogue: string;
        visualPrompt?: string;
        start: number;
        end: number;
        duration: number;
        imageKey?: string;
        imageEffect?: string;
    }>;
    isReady: boolean;
} {
    // Calculate audio duration from subtitles or segments
    let audioDurationSeconds = 0;
    if (scriptContent.subtitles && scriptContent.subtitles.length > 0) {
        const lastSubtitle = scriptContent.subtitles[scriptContent.subtitles.length - 1];
        audioDurationSeconds = lastSubtitle.end / 30; // Convert frames to seconds
    } else if (scriptContent.segments && scriptContent.segments.length > 0) {
        const lastSegment = scriptContent.segments[scriptContent.segments.length - 1];
        if (lastSegment.end) {
            audioDurationSeconds = lastSegment.end / 30;
        } else {
            // Sum up durations
            audioDurationSeconds = scriptContent.segments.reduce((sum, s) => sum + (s.duration || 0), 0);
        }
    }

    return {
        audioKey: scriptContent.audioKey || '',
        audioDurationSeconds,
        subtitles: scriptContent.subtitles || [],
        segments: scriptContent.segments.map(seg => ({
            dialogue: seg.dialogue,
            visualPrompt: seg.visualPrompt,
            start: seg.start || 0,
            end: seg.end || 0,
            duration: seg.duration || 0,
            imageKey: seg.imageKey,
            imageEffect: seg.imageEffect,
        })),
        isReady: false, // Will be set to true after AI processor completes
    };
}

export class ScriptingJob implements ScriptingJobInterface {
    private videoId: string | null = null;

    constructor() { }

    async init(videoId: string): Promise<void> {
        this.videoId = videoId;
    }

    async run(): Promise<void> {
        if (!this.videoId) {
            throw new Error('ScriptingJob not initialized with videoId');
        }

        console.log(`[ScriptingJob] Starting linked flow scripting for video ${this.videoId}`);

        // 1. Fetch Video and Niche Data
        const videoData = await db.select()
            .from(video)
            .where(eq(video.id, this.videoId))
            .limit(1);

        if (videoData.length === 0) {
            throw new Error(`Video ${this.videoId} not found`);
        }

        const v = videoData[0];
        const metadata = (v.metadata || {}) as any;
        const nicheId = v.nicheId || metadata?.nicheId;

        let nicheName: string | undefined = undefined;
        if (nicheId) {
            const nicheData = await db.select()
                .from(contentNiche)
                .where(eq(contentNiche.id, nicheId))
                .limit(1);

            if (nicheData.length > 0) {
                nicheName = nicheData[0].name;
            }
        }

        const idea = metadata?.scriptIdea || v.description || 'No idea provided';
        const durationMinutes = metadata?.duration || 1;
        const durationSeconds = durationMinutes * 60;
        const voiceId = metadata?.voiceId || 'Zephyr';

        let finalScriptContent: ScriptContent;

        // Check if we have a pre-generated script from editor mode
        const isEditorMode = metadata?.editorMode === true;
        const preGeneratedStory = metadata?.generatedScript?.story;

        if (isEditorMode && preGeneratedStory) {
            console.log(`[ScriptingJob] Editor mode detected, using pre-generated story for video ${this.videoId}`);
            // Use the pre-generated story instead of generating a new one
            const result = await runContentPipelineFromStory(this.videoId, preGeneratedStory, voiceId);
            finalScriptContent = result.script;
        } else {
            // Normal flow: generate story from prompt
            const prompt = `Idea: ${idea}. \nNiche: ${nicheName || 'General'}. \nTarget Duration: ${durationSeconds} seconds. \nVoice: ${voiceId}.`;
            const result = await runContentPipeline(this.videoId, prompt, voiceId);
            finalScriptContent = result.script;
        }

        // 3. Save to Script Table (Upsert Logic)
        const existingScript = await db.select()
            .from(script)
            .where(eq(script.videoId, this.videoId))
            .limit(1);

        let finalScriptId: string;
        const scriptContentToSave = {
            id: existingScript.length > 0 ? existingScript[0].id : nanoid(),
            videoId: this.videoId,
            content: finalScriptContent,
            rawText: finalScriptContent.segments.map((s: any) => s.dialogue).join('\n'),
            isApproved: true,
            updatedAt: new Date(),
        };

        if (existingScript.length > 0) {
            finalScriptId = existingScript[0].id;
            await db.update(script)
                .set(scriptContentToSave)
                .where(eq(script.id, finalScriptId));
            console.log(`[ScriptingJob] Updated existing script ${finalScriptId} for video ${this.videoId}`);
        } else {
            finalScriptId = scriptContentToSave.id;
            await db.insert(script).values(scriptContentToSave);
            console.log(`[ScriptingJob] Created new script ${finalScriptId} for video ${this.videoId}`);
        }

        // 4. Build unified renderData from script content
        const renderData = buildRenderData(finalScriptContent);

        // 5. Update Video Status and METADATA with renderData
        const updatedMetadata = {
            ...metadata,
            script: finalScriptContent, // Keep for backward compatibility
            genScriptId: finalScriptId,
            // Unified render data - used by video processor
            renderData: {
                ...renderData,
                subtitleTemplateId: metadata?.subtitleTemplateId,
                subtitleStyleId: metadata?.subtitleStyleId
            },
            // Also set top-level audioKey for compatibility
            audioKey: renderData.audioKey,
            audioDurationSeconds: renderData.audioDurationSeconds,
        };

        await db.update(video)
            .set({
                status: 'SCRIPT_READY',
                metadata: updatedMetadata,
                updatedAt: new Date()
            })
            .where(eq(video.id, this.videoId));

        console.log(`[ScriptingJob] Scripting completed for video ${this.videoId}. RenderData audioKey: ${renderData.audioKey}`);
    }
}
