
import { db } from '../db/index.js';
import { video, contentNiche, script } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ScriptingJobInterface } from './types.js';
import { runContentPipeline } from './agents.js';
import { resolveWorkDir, writeToFile, addWavHeader } from './utils.js';
import { nanoid } from 'nanoid';

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

        // Construct the initial user prompt
        const prompt = `Idea: ${idea}. \nNiche: ${nicheName || 'General'}. \nTarget Duration: ${durationSeconds} seconds. \nVoice: ${voiceId}.`;

        // 2. Run the Linked Flow
        const { script: finalScriptContent } = await runContentPipeline(this.videoId, prompt, voiceId);

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

        // 4. Update Video Status and METADATA
        const updatedMetadata = {
            ...metadata,
            script: finalScriptContent,
            genScriptId: finalScriptId,
        };

        await db.update(video)
            .set({
                status: 'SCRIPT_READY',
                metadata: updatedMetadata,
                updatedAt: new Date()
            })
            .where(eq(video.id, this.videoId));

        console.log(`[ScriptingJob] Scripting completed for video ${this.videoId}.`);
    }
}
