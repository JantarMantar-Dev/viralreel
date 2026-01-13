import {
    LlmAgent,
    Gemini,
    LLMRegistry,
    InMemoryRunner
} from '@google/adk';
import { Schema, Type } from '@google/genai';
import {
    ScriptWriterOutput,
    GenerateScriptOptions,
    ScriptContent
} from './types.js';

// Manual JSON schema for script writer output (Zod 4 is incompatible with ADK's zodObjectToSchema)
const ScriptWriterOutputJsonSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        story: { type: Type.STRING, description: 'The narrative story text' }
    },
    required: ['story']
};
import { CustomGeminiTTS } from './custom_tts_model.js';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-2.5-flash-preview-05-20';
const API_KEY = process.env.GOOGLE_API_KEY;

// Ensure the Gemini model is registered
LLMRegistry.register(Gemini);
LLMRegistry.register(CustomGeminiTTS);

function getGeminiModel() {
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    return new Gemini({ model: MODEL_NAME, apiKey: API_KEY });
}

/**
 * Creates a script writer agent for generating story content
 */
export const createScriptWriter = () => {
    return new LlmAgent({
        name: "script_writer",
        model: getGeminiModel(),
        description: "Writes a narrative story based on a topic.",
        instruction: `You are a professional video script writer. 
Your sole job is to write a compelling story for the requested video topic and duration. 
Focus only on the narrative text. Write in a conversational, engaging tone suitable for short-form video content.
The story should be well-paced and suitable for voice-over narration.`,
        outputSchema: ScriptWriterOutputJsonSchema
    });
};

/**
 * Runs a single agent and returns the parsed output
 */
async function runSingleAgent<T>(agent: LlmAgent, input: string): Promise<T> {
    const runner = new InMemoryRunner({
        agent: agent,
        appName: 'script-generator'
    });
    const session = await runner.sessionService.createSession({
        appName: 'script-generator',
        userId: 'system'
    });
    const eventGenerator = runner.runAsync({
        userId: session.userId,
        sessionId: session.id,
        newMessage: { role: 'user', parts: [{ text: input }] }
    });

    let finalOutput: T | null = null;
    for await (const event of eventGenerator) {
        if (event.author === agent.name && event.content?.parts) {
            const text = event.content.parts.map((p: any) => p.text).join('');
            try {
                if (text.trim().startsWith('{')) {
                    const parsed = JSON.parse(text);
                    finalOutput = parsed as T;
                }
            } catch (e) {
                // Ignore partials
            }
        }
    }
    if (!finalOutput) {
        throw new Error(`Agent ${agent.name} failed to produce valid JSON output.`);
    }
    return finalOutput;
}

/**
 * Generates only the script/story content for editor mode preview
 * This is a lighter version that doesn't include audio/subtitle generation
 */
export const generateScriptOnly = async (options: GenerateScriptOptions): Promise<{ story: string }> => {
    const { scriptIdea, nicheName, duration } = options;
    const durationSeconds = duration * 60;

    console.log(`[ScriptGenerator] Generating script for idea: ${scriptIdea.substring(0, 50)}...`);

    const prompt = `Idea: ${scriptIdea}. 
Niche: ${nicheName || 'General'}. 
Target Duration: ${durationSeconds} seconds.
Write a compelling narrative story that can be narrated in approximately ${durationSeconds} seconds.`;

    const scriptWriter = createScriptWriter();
    const scriptWriterOutput = await runSingleAgent<ScriptWriterOutput>(scriptWriter, prompt);

    console.log(`[ScriptGenerator] Story generated: ${scriptWriterOutput.story.substring(0, 100)}...`);

    return {
        story: scriptWriterOutput.story
    };
};

/**
 * Estimates word count and duration from a story
 */
export const estimateStoryDuration = (story: string): { wordCount: number; estimatedSeconds: number } => {
    const wordCount = story.split(/\s+/).filter(w => w.length > 0).length;
    // Average speaking rate is about 150 words per minute
    const estimatedSeconds = Math.ceil((wordCount / 150) * 60);
    return { wordCount, estimatedSeconds };
};
