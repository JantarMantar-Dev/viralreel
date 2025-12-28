
import { db } from '../db/index.js';
import { video, contentNiche, script } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ScriptingJobInterface } from './types.js';
import { runScriptingAndAudioFlow } from './agents.js';
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
        const { script: finalScriptContent, audioBase64: finalAudioBase64 } = await runScriptingAndAudioFlow(prompt, voiceId);

        // 3. Save to Local File System using utilities
        try {
            const workDir = await resolveWorkDir(this.videoId);

            const scriptPath = await writeToFile(workDir, 'script.json', JSON.stringify(finalScriptContent, null, 2));
            console.log(`[ScriptingJob] Saved local script to: ${scriptPath}`);

            if (finalAudioBase64) {
                const pcmBuffer = Buffer.from(finalAudioBase64, 'base64');
                // Google Gemini TTS Output is typically 24kHz, 1 channel, 16-bit PCM (based on MIME type audio/L16;rate=24000)
                const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);

                const audioPath = await writeToFile(workDir, 'audio.wav', wavBuffer);
                console.log(`[ScriptingJob] Saved local audio to: ${audioPath}`);
            } else {
                console.warn(`[ScriptingJob] No audio data received from flow.`);
            }
        } catch (err) {
            console.error(`[ScriptingJob] Failed to save local script/audio file:`, err);
        }

        // 4. Save to Script Table
        const scriptId = nanoid();
        await db.insert(script).values({
            id: scriptId,
            videoId: this.videoId,
            content: finalScriptContent,
            rawText: finalScriptContent.segments.map((s: any) => s.dialogue).join('\n'),
            isApproved: true,
        });

        // 5. Update Video Status and METADATA
        const updatedMetadata = {
            ...metadata,
            script: finalScriptContent,
            genScriptId: scriptId,
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
