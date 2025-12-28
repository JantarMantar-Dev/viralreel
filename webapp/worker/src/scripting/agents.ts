
import {
    LlmAgent,
    SequentialAgent,
    zodObjectToSchema,
    Gemini,
    LLMRegistry,
    InMemoryRunner
} from '@google/adk';
import { ScriptWriterOutputSchema, SegmenterOutputSchema, VisualizerOutputSchema, ScriptContent, SubtitlesOutputSchema, ScriptWriterOutput, SegmenterOutput, VisualizerOutput } from './types.js';
import { resolveWorkDir, writeToFile, addWavHeader, reconstructStoryFromSubtitles } from './utils.js';
import { CustomGeminiTTS } from './custom_tts_model.js';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';
const TTS_MODEL_NAME = process.env.GOOGLE_TTS_MODEL || 'gemini-2.0-flash-exp';
const DEFAULT_VOICE = process.env.GOOGLE_TTS_VOICE || 'Zephyr';
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

// --- Individual Agent Creators ---

export const createScriptWriter = () => {
    return new LlmAgent({
        name: "script_writer",
        model: getGeminiModel(),
        description: "Writes a narrative story based on a topic.",
        instruction: `You are a professional video script writer. 
Your sole job is to write a compelling story for the requested video topic and duration. 
Focus only on the narrative text.`,
        outputSchema: zodObjectToSchema(ScriptWriterOutputSchema)
    });
};

export const createSegmenter = () => {
    return new LlmAgent({
        name: "segmenter",
        model: getGeminiModel(),
        description: "Breaks down a story into segments with durations.",
        instruction: `You are an expert video editor and script segmenter. 
Review the story provided.
Break strictly that story down into logical segments.
Each segment must have 'dialogue' and 'duration'.
The sum of durations should be approximately the lengths inferred from the text.`,
        outputSchema: zodObjectToSchema(SegmenterOutputSchema)
    });
};

export const createVisualizer = () => {
    return new LlmAgent({
        name: "visualizer",
        model: getGeminiModel(),
        description: "Generates visual prompts for script segments.",
        instruction: `You are a creative visual director for AI video generation.
Review the segmented script provided.
For each segment, generate a 'visualPrompt' that describes the scene.
Ensure the visual flow builds on the previous storytelling and remains consistent.
Output the full segments with dialogue, duration, and the new visualPrompt.`,
        outputSchema: zodObjectToSchema(VisualizerOutputSchema)
    });
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
    // Using CustomGeminiTTS (Groq) for robust transcription
    const subtitleModel = new CustomGeminiTTS({ model: 'groq-whisper', apiKey: API_KEY });

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


// --- Execution Helpers ---

async function runSingleAgent<T>(agent: LlmAgent, input: string): Promise<T> {
    const runner = new InMemoryRunner({
        agent: agent,
        appName: 'single-agent-runner'
    });
    const session = await runner.sessionService.createSession({
        appName: 'single-agent-runner',
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
                    // Allow for some flexibility in checking keys, but usually invalid JSON fails parse first
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
 * Step 2: Generate Audio
 */
export const generateAudio = async (text: string, voiceId: string, videoId?: string): Promise<{ audioBase64: string, wavBase64: string }> => {
    console.log(`[ScriptingFlow] Generating audio with Voice: ${voiceId}`);
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
        newMessage: { role: 'user', parts: [{ text: text }] }
    });

    let finalAudioBase64: string | null = null;
    console.log(`[ScriptingFlow] Waiting for audio events...`);
    for await (const event of audioEventGenerator) {
        if (event.author === 'audio_generator') {
            if (event.content?.parts) {
                for (const part of event.content.parts as any[]) {
                    if (part.inlineData?.data) {
                        finalAudioBase64 = part.inlineData.data;
                    }
                }
            }
        }
    }

    if (!finalAudioBase64) {
        throw new Error('[ScriptingFlow] No finalAudioBase64 was captured in the loop.');
    }

    let wavBase64 = finalAudioBase64;
    // Save locally if videoId provided
    if (videoId) {
        try {
            const workDir = await resolveWorkDir(videoId);
            const pcmBuffer = Buffer.from(finalAudioBase64, 'base64');
            const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);

            const audioPath = await writeToFile(workDir, 'audio.wav', wavBuffer);
            console.log(`[ScriptingFlow] Saved local audio to: ${audioPath}`);

            wavBase64 = wavBuffer.toString('base64');
        } catch (err) {
            console.error(`[ScriptingFlow] Failed to save local audio file:`, err);
        }
    }

    return { audioBase64: finalAudioBase64, wavBase64 };
};

/**
 * Step 3: Generate Subtitles
 */
export const generateSubtitles = async (videoId: string): Promise<any> => {
    console.log(`[ScriptingFlow] Generating subtitles for Video ${videoId}...`);

    // Resolve workDir to find audio.wav
    const workDir = await resolveWorkDir(videoId);
    const audioPath = path.resolve(workDir, 'audio.wav');

    if (!fs.existsSync(audioPath)) {
        console.warn(`[ScriptingFlow] Audio file not found at ${audioPath}. Skipping subtitles.`);
        return null;
    }

    const apiKey = process.env.GROQ_TTS_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_TTS_KEY not found in environment variables");
    }

    const groq = new Groq({ apiKey });

    try {
        console.log(`[ScriptingFlow] Transcribing ${audioPath} with Groq...`);
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-large-v3-turbo",
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
            language: "en",
        });

        if ('words' in transcription && Array.isArray((transcription as any).words)) {
            const subtitles = (transcription as any).words.map((w: any) => ({
                text: w.word,
                start: w.start * 30, // Convert seconds to frames (Assuming 30fps)
                end: w.end * 30
            }));
            console.log(`[ScriptingFlow] Generated ${subtitles.length} subtitle words.`);


            // Fix overlaps
            for (let i = 1; i < subtitles.length; i++) {
                const prev = subtitles[i - 1];
                const current = subtitles[i];

                if (current.start < prev.end) {
                    // Push out next start after 1 frame of prev end
                    current.start = prev.end + 1;

                    // Maintain at least 1 frame duration if start pushed past end
                    if (current.end <= current.start) {
                        current.end = current.start + 1;
                    }
                }
            }

            return subtitles;
        } else {
            console.warn("[ScriptingFlow] No words found in Groq response.");
            return null;
        }

    } catch (error) {
        console.error("[ScriptingFlow] Groq Transcription Error:", error);
        // Don't crash the pipeline, just return null for subtitles
        return null;
    }
};

/**
 * Orchestrator Pipeline - New Flow
 */
export const runContentPipeline = async (videoId: string, prompt: string, voiceId: string = DEFAULT_VOICE) => {
    console.log(`[ContentPipeline] Starting flow for Video ${videoId}`);

    // 1. Generate Story
    console.log(`[ContentPipeline] 1. Generating Story...`);
    const scriptWriter = createScriptWriter();
    const scriptWriterOutput = await runSingleAgent<ScriptWriterOutput>(scriptWriter, prompt);
    const story = scriptWriterOutput.story;
    console.log(`[ContentPipeline] Story generated: ${story.substring(0, 50)}...`);

    // 2. Generate Audio
    console.log(`[ContentPipeline] 2. Generating Audio...`);
    await generateAudio(story, voiceId, videoId);

    // 3. Generate Subtitles
    console.log(`[ContentPipeline] 3. Generating Subtitles...`);
    const subtitles = await generateSubtitles(videoId);

    // 4. Reconstruct Story from Subtitles (Ground Truth)
    const groundTruthStory = reconstructStoryFromSubtitles(subtitles);
    console.log(`[ContentPipeline] 4. Reconstructed Story: ${groundTruthStory.substring(0, 50)}...`);

    // 5. Segment Story
    console.log(`[ContentPipeline] 5. Segmenting Story...`);
    const segmenter = createSegmenter();
    const segmenterOutput = await runSingleAgent<SegmenterOutput>(segmenter, groundTruthStory);

    // 6. Visualizer
    let segments = segmenterOutput.segments;
    // Map simplified segments to ScriptSegment type (add empty visualPrompt)
    let scriptSegments = segments.map(s => ({
        ...s,
        visualPrompt: ""
    }));
    console.log(`[ContentPipeline] 6. Generating Visuals...`);
    const visualizer = createVisualizer();
    // Pass the aligned segments to the visualizer so it knows the context for each scene.
    // We strictly ask it to output the inputs with visual prompts added.
    const visualizerOutput = await runSingleAgent<VisualizerOutput>(visualizer, JSON.stringify({ segments: scriptSegments }));

    // Merge visual prompts back into our aligned segments (preserving the aligned durations!)
    // We assume the visualizer returns segments in the same order.
    const finalSegments = scriptSegments.map((seg, index) => {
        const visualSeg = visualizerOutput.segments[index];
        return {
            ...seg,
            visualPrompt: visualSeg ? visualSeg.visualPrompt : "Cinematic scene matching the dialogue."
        };
    });

    const scriptContent: ScriptContent = {
        title: "",
        segments: finalSegments,
        subtitles: subtitles || []
    };

    // Save final script
    try {
        const workDir = await resolveWorkDir(videoId);
        const scriptPath = await writeToFile(workDir, 'script.json', JSON.stringify(scriptContent, null, 2));
        console.log(`[ContentPipeline] Saved local script to: ${scriptPath}`);
    } catch (err) {
        console.error(`[ContentPipeline] Failed to save local script file:`, err);
    }

    return {
        script: scriptContent,
    };
};

export { LlmAgent, SequentialAgent };
