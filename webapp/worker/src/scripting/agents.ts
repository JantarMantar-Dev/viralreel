
import {
    LlmAgent,
    SequentialAgent,
    zodObjectToSchema,
    Gemini,
    LLMRegistry
} from '@google/adk';
import { ScriptWriterOutputSchema, SegmenterOutputSchema, VisualizerOutputSchema } from './types.js';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';
const TTS_MODEL_NAME = 'gemini-2.5-pro-preview-tts';
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
    const ttsVoice = options?.ttsVoice || "Zephyr";
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    const ttsModel = new Gemini({ model: TTS_MODEL_NAME, apiKey: API_KEY });

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

// Exporting types for use in other files
export { LlmAgent, SequentialAgent };
