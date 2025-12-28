
import { db } from '../db/index.js';
import { video, contentNiche, script } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ScriptingJobInterface } from './types.js';
import { createScriptingOrchestrator, createAudioGenerator } from './agents.js';
import { InMemoryRunner } from '@google/adk';
import { nanoid } from 'nanoid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ScriptContent } from './types.js';

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

        console.log(`[ScriptingJob] Starting ADK agentic scripting for video ${this.videoId}`);

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

        // 2. Instantiate ADK Runner
        const orchestrator = createScriptingOrchestrator();
        const runner = new InMemoryRunner({
            agent: orchestrator,
            appName: 'scripting-service'
        });

        // 3. Run the Agent
        console.log(`[ScriptingJob] Running orchestrator...`);
        let finalScriptContent: ScriptContent | null = null;
        let finalAudioBase64: string | null = null;

        const session = await runner.sessionService.createSession({
            appName: 'scripting-service',
            userId: 'system' // Internal system user
        });

        const eventGenerator = runner.runAsync({
            userId: session.userId,
            sessionId: session.id,
            newMessage: {
                role: 'user',
                parts: [{ text: prompt }]
            }
        });

        // Iterate through events to find the final output
        for await (const event of eventGenerator) {
            // Check for output from the "visualizer" agent (the last one)
            // Note: ADK events might have author as "visualizer" or similar
            if (event.author === 'visualizer' && event.content?.parts) {
                const text = event.content.parts.map((p: any) => p.text).join('');
                try {
                    if (text.trim().startsWith('{')) {
                        console.log('[ScriptingJob] Received potential final script:', text.substring(0, 100) + '...');
                        const parsed = JSON.parse(text);
                        if (parsed.segments && Array.isArray(parsed.segments)) {
                            finalScriptContent = parsed as ScriptContent;
                        }
                    }
                } catch (e) {
                    // Ignore partials or non-json
                }
            }

        }

        if (!finalScriptContent) {
            throw new Error('[ScriptingJob] Failed to generate valid script content from agents.');
        }

        // 3.2 Generate Audio with Standalone Agent
        console.log(`[ScriptingJob] Generating audio with standalone generator...`);
        const fullDialogue = finalScriptContent.segments.map((s: any) => s.dialogue).join(' ');
        const audioGenerator = createAudioGenerator({ ttsVoice: voiceId });
        const audioRunner = new InMemoryRunner({
            agent: audioGenerator,
            appName: 'scripting-service'
        });

        const audioSession = await audioRunner.sessionService.createSession({
            appName: 'scripting-service',
            userId: 'system'
        });

        const audioEventGenerator = audioRunner.runAsync({
            userId: audioSession.userId,
            sessionId: audioSession.id,
            newMessage: {
                role: 'user',
                parts: [{ text: fullDialogue }]
            }
        });

        for await (const event of audioEventGenerator) {
            if (event.author === 'audio_generator' && event.content?.parts) {
                for (const part of event.content.parts as any[]) {
                    if (part.inlineData?.data) {
                        console.log('[ScriptingJob] Received audio data part.');
                        finalAudioBase64 = part.inlineData.data;
                    }
                }
            }
        }

        // 3.5 Save to Local File System
        try {
            let baseDir = process.env.VIDEO_WORK_DIR;
            if (!baseDir) {
                baseDir = path.resolve(process.cwd(), 'work_dir');
            }
            // if we are using /app/work_dir then that path is only valid in the container this means we are running outside of the container
            // so we need use cwd() logic
            try {
                await fs.access(baseDir);
            } catch {
                baseDir = path.resolve(process.cwd(), 'work_dir');
                await fs.mkdir(baseDir, { recursive: true });
            }

            const workDir = path.resolve(baseDir, this.videoId);
            await fs.mkdir(workDir, { recursive: true });

            const scriptPath = path.join(workDir, 'script.json');
            await fs.writeFile(scriptPath, JSON.stringify(finalScriptContent, null, 2));
            console.log(`[ScriptingJob] Saved local script to: ${scriptPath}`);

            if (finalAudioBase64) {
                const audioPath = path.join(workDir, 'audio.mp3');
                await fs.writeFile(audioPath, Buffer.from(finalAudioBase64, 'base64'));
                console.log(`[ScriptingJob] Saved local audio to: ${audioPath}`);
            } else {
                console.warn(`[ScriptingJob] No audio data received from audio_generator agent.`);
            }
        } catch (err) {
            console.error(`[ScriptingJob] Failed to save local script/audio file:`, err);
            // Non-blocking error
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

        console.log(`[ScriptingJob] Scripting completed for video ${this.videoId}. Script stored in metadata.`);
    }
}
