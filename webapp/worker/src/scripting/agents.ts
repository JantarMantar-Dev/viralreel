
import {
    LlmAgent,
    SequentialAgent,
    zodObjectToSchema,
    Gemini,
    LLMRegistry,
    InMemoryRunner
} from '@google/adk';
import { ScriptWriterOutputSchema, SegmenterOutputSchema, VisualizerOutputSchema, ScriptContent, SubtitlesOutputSchema } from './types.js';
import { resolveWorkDir, writeToFile, addWavHeader } from './utils.js';
import { CustomGeminiTTS } from './custom_tts_model.js';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';
const TTS_MODEL_NAME = process.env.GOOGLE_TTS_MODEL || 'gemini-2.0-flash-exp';
const SUBTITLE_MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';
const DEFAULT_VOICE = process.env.GOOGLE_TTS_VOICE || 'Zephyr';
const API_KEY = process.env.GOOGLE_API_KEY;

// Ensure the Gemini model is registered
LLMRegistry.register(Gemini);
LLMRegistry.register(CustomGeminiTTS);

export const createScriptingOrchestrator = () => {
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    const geminiModel = new Gemini({ model: MODEL_NAME, apiKey: API_KEY });

    // Agent 1: Script Writer
    const scriptWriter = new LlmAgent({
        name: "script_writer",
        model: geminiModel,
        description: "Writes a narrative story based on a topic.",
        instruction: `You are a professional video script writer. 
Your sole job is to write a compelling story for the requested video topic and duration. 
Focus only on the narrative text.`,
        outputSchema: zodObjectToSchema(ScriptWriterOutputSchema)
    });

    // Agent 2: Segmenter
    const segmenter = new LlmAgent({
        name: "segmenter",
        model: geminiModel,
        description: "Breaks down a story into segments with durations.",
        instruction: `You are an expert video editor and script segmenter. 
Review the story provided by the previous agent.
Break strictly that story down into logical segments.
Each segment must have 'dialogue' and 'durationSeconds'.
The sum of durations should be approximately the target duration mentioned in the request.`,
        outputSchema: zodObjectToSchema(SegmenterOutputSchema)
    });

    // Agent 3: Visualizer
    const visualizer = new LlmAgent({
        name: "visualizer",
        model: geminiModel,
        description: "Generates visual prompts for script segments.",
        instruction: `You are a creative visual director for AI video generation.
Review the segmented script provided by the previous agent.
For each segment, generate a 'visualPrompt' that describes the scene.
Ensure the visual flow builds on the previous storytelling and remains consistent.
Output the full segments with dialogue, duration, and the new visualPrompt.`,
        outputSchema: zodObjectToSchema(VisualizerOutputSchema)
    });


    // Orchestrator: Sequential execution
    const orchestrator = new SequentialAgent({
        name: "scripting_orchestrator",
        description: "Orchestrates the creation of a video script.",
        subAgents: [scriptWriter, segmenter, visualizer]
    });

    return orchestrator;
};

export const createAudioGenerator = (options?: { ttsVoice?: string }) => {
    const ttsVoice = options?.ttsVoice || DEFAULT_VOICE;
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    const ttsModel = new CustomGeminiTTS({ model: TTS_MODEL_NAME, apiKey: API_KEY });

    return new LlmAgent({
        name: "audio_generator",
        model: ttsModel,
        description: "Generates audio for the provided dialogue.",
        instruction: `You are a professional voice-over artist.
Generate high-quality audio for the provided text.
Do not add any additional commentary or text, just generate the audio for the dialogue.`,
        generateContentConfig: {
            responseModalities: ["audio"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: ttsVoice
                    }
                }
            }
        }
    });
};

export const createSubtitleGenerator = () => {
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    // Using Gemini 1.5 Pro as it supports audio input well.
    const subtitleModel = new Gemini({ model: SUBTITLE_MODEL_NAME, apiKey: API_KEY });

    return new LlmAgent({
        name: "subtitle_generator",
        model: subtitleModel,
        description: "Generates word-level subtitles from audio.",
        instruction: `Analyze the provided audio file and generate a word-by-word breakdown of the spoken text.
Output a JSON object with a 'subtitles' array.
Each item must have:
- 'text': The spoken word.
- 'start': The start time in video frames (assuming 30fps).
- 'end': The end time in video frames (assuming 30fps).
Ensure the frames align perfectly with the voice sections.`,
        outputSchema: zodObjectToSchema(SubtitlesOutputSchema)
    });
};

/**
 * Linked flow for generating script and then audio.
 */
export const runScriptingAndAudioFlow = async (videoId: string, prompt: string, voiceId: string = DEFAULT_VOICE) => {
    console.log(`[ScriptingFlow] Starting flow for Video ${videoId} with Voice: ${voiceId}`);

    // 1. Scripting Orchestrator
    const orchestrator = createScriptingOrchestrator();
    const scriptRunner = new InMemoryRunner({
        agent: orchestrator,
        appName: 'scripting-flow'
    });

    const scriptSession = await scriptRunner.sessionService.createSession({
        appName: 'scripting-flow',
        userId: 'system'
    });

    const scriptEventGenerator = scriptRunner.runAsync({
        userId: scriptSession.userId,
        sessionId: scriptSession.id,
        newMessage: { role: 'user', parts: [{ text: prompt }] }
    });

    let finalScriptContent: ScriptContent | null = null;
    for await (const event of scriptEventGenerator) {
        if (event.author === 'visualizer' && event.content?.parts) {
            const text = event.content.parts.map((p: any) => p.text).join('');
            try {
                if (text.trim().startsWith('{')) {
                    const parsed = JSON.parse(text);
                    if (parsed.segments && Array.isArray(parsed.segments)) {
                        finalScriptContent = parsed as ScriptContent;
                    }
                }
            } catch (e) {
                // Ignore partials
            }
        }
    }

    if (!finalScriptContent) {
        throw new Error('[ScriptingFlow] Failed to get valid script content from agents');
    }

    // 2. Audio Generator
    const fullDialogue = finalScriptContent.segments.map((s: any) => s.dialogue).join(' ');
    const audioGenerator = createAudioGenerator({ ttsVoice: voiceId });
    const audioRunner = new InMemoryRunner({
        agent: audioGenerator,
        appName: 'audio-flow'
    });

    const audioSession = await audioRunner.sessionService.createSession({
        appName: 'audio-flow',
        userId: 'system'
    });

    const audioEventGenerator = audioRunner.runAsync({
        userId: audioSession.userId,
        sessionId: audioSession.id,
        newMessage: { role: 'user', parts: [{ text: fullDialogue }] }
    });

    let finalAudioBase64: string | null = null;
    console.log(`[ScriptingFlow] Waiting for audio events...`);
    for await (const event of audioEventGenerator) {
        console.log(`[ScriptingFlow] Audio Event: Author=${event.author}, Type=${(event as any).type}`);

        if (event.author === 'audio_generator') {
            // console.log(`[ScriptingFlow] Full Audio Event:`, JSON.stringify(event, null, 2));
            if (event.content?.parts) {
                // console.log(`[ScriptingFlow] Audio Content Parts:`, JSON.stringify(event.content.parts, null, 2));
                for (const part of event.content.parts as any[]) {
                    if (part.inlineData?.data) {
                        console.log(`[ScriptingFlow] Found inlineData.data (length: ${part.inlineData.data.length})`);
                        finalAudioBase64 = part.inlineData.data;
                    }
                }
            }
        }
    }

    if (!finalAudioBase64) {
        console.warn(`[ScriptingFlow] No finalAudioBase64 was captured in the loop.`);
        throw new Error('[ScriptingFlow] No finalAudioBase64 was captured in the loop.');
    }

    // 3. Save audio.wav with header
    let wavBase64 = finalAudioBase64;
    try {
        const workDir = await resolveWorkDir(videoId);
        const pcmBuffer = Buffer.from(finalAudioBase64, 'base64');
        const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);

        const audioPath = await writeToFile(workDir, 'audio.wav', wavBuffer);
        console.log(`[ScriptingFlow] Saved local audio to: ${audioPath}`);

        wavBase64 = wavBuffer.toString('base64');
    } catch (err) {
        console.error(`[ScriptingFlow] Failed to save local audio file:`, err);
        // Fallback to original if saving fails, though adding header is crucial for some players/models
    }

    // 4. Subtitle Generator (using WAV audio)

    const subtitleGenerator = createSubtitleGenerator();
    const subtitleRunner = new InMemoryRunner({
        agent: subtitleGenerator,
        appName: 'subtitle-flow'
    });

    const subtitleSession = await subtitleRunner.sessionService.createSession({
        appName: 'subtitle-flow',
        userId: 'system'
    });

    const subtitleEventGenerator = subtitleRunner.runAsync({
        userId: subtitleSession.userId,
        sessionId: subtitleSession.id,
        newMessage: {
            role: 'user',
            parts: [
                {
                    inlineData: {
                        mimeType: 'audio/wav',
                        data: wavBase64
                    }
                },
                { text: "Generate subtitles for this audio." }
            ]
        }
    });

    let finalSubtitles: any = null;
    console.log(`[ScriptingFlow] Waiting for subtitle events...`);
    for await (const event of subtitleEventGenerator) {
        if (event.author === 'subtitle_generator' && event.content?.parts) {
            const text = event.content.parts.map((p: any) => p.text).join('');
            try {
                if (text.trim().startsWith('{')) {
                    const parsed = JSON.parse(text);
                    if (parsed.subtitles && Array.isArray(parsed.subtitles)) {
                        finalSubtitles = parsed.subtitles;
                    }
                }
            } catch (e) {
                // Ignore partials
            }
        }
    }

    // Attach subtitles to script content if found
    if (finalSubtitles && finalScriptContent) {
        finalScriptContent.subtitles = finalSubtitles;
    }

    // 5. Save final script
    try {
        const workDir = await resolveWorkDir(videoId);
        const scriptPath = await writeToFile(workDir, 'script.json', JSON.stringify(finalScriptContent, null, 2));
        console.log(`[ScriptingFlow] Saved local script to: ${scriptPath}`);
    } catch (err) {
        console.error(`[ScriptingFlow] Failed to save local script file:`, err);
    }

    return {
        script: finalScriptContent,
    };
};

// Exporting types for use in other files
export { LlmAgent, SequentialAgent };
