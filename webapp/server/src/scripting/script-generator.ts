import {
    LlmAgent,
    Gemini,
    LLMRegistry,
    InMemoryRunner,
    BuiltInCodeExecutor
} from '@google/adk';
import type { LlmRequest } from '@google/adk';
import {
    GenerateScriptOptions
} from './types.js';
import { CustomGeminiTTS } from './custom_tts_model.js';
import dotenv from 'dotenv';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';
const API_KEY = process.env.GOOGLE_API_KEY;

// Ensure the Gemini model is registered
LLMRegistry.register(Gemini);
LLMRegistry.register(CustomGeminiTTS);

/**
 * No-op code executor that doesn't throw for Gemini 3 models.
 * ADK's InMemoryRunner auto-assigns BuiltInCodeExecutor which only supports Gemini 2.
 * This override prevents that error while still satisfying ADK's instanceof check.
 */
class NoOpCodeExecutor extends BuiltInCodeExecutor {
    processLlmRequest(_llmRequest: LlmRequest): void {
        // Do nothing - we don't need code execution for script generation
    }
}

function getGeminiModel() {
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    return new Gemini({ model: MODEL_NAME, apiKey: API_KEY });
}

/**
 * Creates a script writer agent for generating story content
 * Outputs plain text story (no JSON wrapper needed)
 */
export const createScriptWriter = () => {
    return new LlmAgent({
        name: "script_writer",
        model: getGeminiModel(),
        description: "Writes a narrative story based on a topic.",
        instruction: `You are a professional video script writer. 
Your sole job is to write a compelling story for the requested video topic and duration. 
Focus only on the narrative text. Write in a conversational, engaging tone suitable for short-form video content.
The story should be well-paced and suitable for voice-over narration.
Output ONLY the story text itself - no titles, no formatting, no JSON, just the pure narrative.`,
        codeExecutor: new NoOpCodeExecutor()  // Disable code execution
    });
};

/**
 * Runs a single agent and returns the plain text output
 */
async function runSingleAgentText(agent: LlmAgent, input: string): Promise<string> {
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

    let finalOutput: string = '';
    for await (const event of eventGenerator) {
        if (event.author === agent.name && event.content?.parts) {
            const text = event.content.parts.map((p: any) => p.text).filter(Boolean).join('');
            if (text.trim()) {
                finalOutput = text;
            }
        }
    }
    if (!finalOutput.trim()) {
        throw new Error(`Agent ${agent.name} failed to produce output.`);
    }
    return finalOutput.trim();
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
    const story = await runSingleAgentText(scriptWriter, prompt);

    console.log(`[ScriptGenerator] Story generated: ${story.substring(0, 100)}...`);

    return {
        story
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
