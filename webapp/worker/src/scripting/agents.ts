
import {
    LlmAgent,
    SequentialAgent,
    zodObjectToSchema,
    Gemini,
    LLMRegistry,
    InMemoryRunner
} from '@google/adk';
import { ScriptWriterOutputSchema, SegmenterOutputSchema, VisualizerOutputSchema, ScriptContent } from './types.js';
import { CustomGeminiTTS } from './custom_tts_model.js';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-1.5-flash';
const TTS_MODEL_NAME = process.env.GOOGLE_TTS_MODEL || 'gemini-1.5-flash';
const DEFAULT_VOICE = process.env.GOOGLE_TTS_VOICE || 'Zephyr';
const API_KEY = process.env.GOOGLE_API_KEY;

// Ensure the Gemini model is registered
LLMRegistry.register(Gemini);

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

/**
 * Linked flow for generating script and then audio.
 */
export const runScriptingAndAudioFlow = async (prompt: string, voiceId: string = DEFAULT_VOICE) => {
    console.log(`[ScriptingFlow] Starting flow with Voice: ${voiceId}`);

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
            console.log(`[ScriptingFlow] Full Audio Event:`, JSON.stringify(event, null, 2));
            if (event.content?.parts) {
                console.log(`[ScriptingFlow] Audio Content Parts:`, JSON.stringify(event.content.parts, null, 2));
                for (const part of event.content.parts as any[]) {
                    if (part.inlineData?.data) {
                        console.log(`[ScriptingFlow] Found inlineData.data (length: ${part.inlineData.data.length})`);
                        finalAudioBase64 = part.inlineData.data;
                    } else if (part.fileData) {
                        console.log(`[ScriptingFlow] Found fileData:`, part.fileData);
                    }
                }
            }
        }
    }

    if (!finalAudioBase64) {
        console.warn(`[ScriptingFlow] No finalAudioBase64 was captured in the loop.`);
    }

    return {
        script: finalScriptContent,
        audioBase64: finalAudioBase64
    };
};

// Exporting types for use in other files
export { LlmAgent, SequentialAgent };
