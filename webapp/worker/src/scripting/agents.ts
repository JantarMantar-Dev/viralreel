
import {
    LlmAgent,
    SequentialAgent,
    zodObjectToSchema,
    Gemini,
    LLMRegistry,
    InMemoryRunner,
    BuiltInCodeExecutor
} from '@google/adk';
import type { LlmRequest } from '@google/adk';
import { ScriptWriterOutputSchema, SegmenterOutputSchema, VisualizerOutputSchema, ScriptContent, SubtitlesOutputSchema, ScriptWriterOutput, SegmenterOutput, VisualizerOutput } from './types.js';
import { resolveWorkDir, writeToFile, addWavHeader, reconstructStoryFromSubtitles } from './utils.js';
import { CustomGeminiTTS } from './custom_tts_model.js';
import { uploadToS3 } from '../lib/s3.js';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MODEL_NAME = process.env.GOOGLE_SCRIPT_MODEL || 'gemini-3-flash-preview';
const TTS_MODEL_NAME = process.env.GOOGLE_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const DEFAULT_VOICE = process.env.GOOGLE_TTS_VOICE || 'Zephyr';
const API_KEY = process.env.GOOGLE_API_KEY;
const IS_DEV = process.env.NODE_ENV === 'development';

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

// --- Individual Agent Creators ---

export const createScriptWriter = () => {
    return new LlmAgent({
        name: "script_writer",
        model: getGeminiModel(),
        description: "Writes a narrative story based on a topic.",
        instruction: `You are a professional video script writer. 
Your sole job is to write a compelling story for the requested video topic and duration. 
Focus only on the narrative text.`,
        outputSchema: zodObjectToSchema(ScriptWriterOutputSchema),
        codeExecutor: new NoOpCodeExecutor()
    });
};

export const createSegmenter = () => {
    return new LlmAgent({
        name: "segmenter",
        model: getGeminiModel(),
        description: "Breaks down a story into segments with durations.",
        instruction: `You are a professional video editor and script segmentation expert.
You will be provided with a JSON array of words, each with a 'text', 'start', and 'end' timestamp (in frames).

Your task is to:
1. **Analyze the Narrative**: Read the words to identify logical transitions, scene breaks, and narrative beats for video storytelling.
2. **Create Segments**: Group these words into coherent segments of dialogue. Ensure each segment is large enough to be a natural conversation flow.
3. **Strict Fidelity**: Every word from the input must be included in exactly one segment, in the original order. No words should be skipped, added, or changed.
4. **Extract Timestamps**: For each segment:
   - 'dialogue': The combined text of all words in this segment.
   - 'start': The 'start' timestamp of the first word in the segment.
   - 'end': The 'end' timestamp of the last word in the segment.
5. **Pacing Constraints**:
   - For approximately 30 seconds of total audio, aim for a maximum of 5 segments.
   - For approximately 60 seconds of total audio, aim for a maximum of 10 segments.
   Ensure each segment feels substantial and avoids rapid-fire cuts unless the narrative demands it.

Output a JSON object with a 'segments' array following the requested schema.`,
        outputSchema: zodObjectToSchema(SegmenterOutputSchema),
        codeExecutor: new NoOpCodeExecutor()
    });
};

export const createVisualizer = () => {
    return new LlmAgent({
        name: "visualizer",
        model: getGeminiModel(),
        description: "Generates visual prompts for script segments.",
        instruction: `You are a creative visual director for AI video generation.
Review the segmented script provided.
For each segment, generate a detailed 'visualPrompt' that describes the scene.

Your task is to:
1. **Identify Key Elements**: Extract several narrative elements, characters, or objects from the dialogue and embed them vividly into the description.
2. **Visual Composition**: Create cinematic, high-quality prompts.
3. **Split Compositions**: If the scene benefits from showing two related but distinct concepts simultaneously, you may describe a split-screen or dual-part composition within the prompt.
4. **Continuity**: Ensure the visual flow builds on the previous storytelling and remains consistent.

Output the full segments with dialogue, duration, and the new visualPrompt.`,
        outputSchema: zodObjectToSchema(VisualizerOutputSchema),
        codeExecutor: new NoOpCodeExecutor()
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
        },
        codeExecutor: new NoOpCodeExecutor()
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
        outputSchema: zodObjectToSchema(SubtitlesOutputSchema),
        codeExecutor: new NoOpCodeExecutor()
    });
};


// --- Execution Helpers ---

async function runSingleAgent<T>(agent: LlmAgent, input: string): Promise<T> {
    if (IS_DEV) {
        console.log(`[Agent: ${agent.name}] Instruction:\n${agent.instruction}`);
        console.log(`[Agent: ${agent.name}] Input:\n${input}`);
    }
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
export const generateAudio = async (text: string, voiceId: string, videoId?: string): Promise<{ audioBase64: string, wavBase64: string, durationFrames: number, audioKey?: string }> => {
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
    let audioKey: string | undefined;

    // Save locally if videoId provided
    if (videoId) {
        try {
            const workDir = await resolveWorkDir(videoId);
            const pcmBuffer = Buffer.from(finalAudioBase64, 'base64');
            const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);

            const audioPath = path.join(workDir, 'audio.wav');
            try {
                await fs.promises.unlink(audioPath);
            } catch (err) {
                // Ignore if file doesn't exist
            }

            await writeToFile(workDir, 'audio.wav', wavBuffer);
            console.log(`[ScriptingFlow] Saved local audio to: ${audioPath}`);

            // Upload to S3
            audioKey = `videos/${videoId}/audio.wav`;
            await uploadToS3(audioPath, audioKey, 'audio/wav');
            console.log(`[ScriptingFlow] Uploaded audio to S3: ${audioKey}`);

            wavBase64 = wavBuffer.toString('base64');
        } catch (err) {
            console.error(`[ScriptingFlow] Failed to save/upload audio file:`, err);
        }
    }

    // Calculate total duration in frames (assumes 24kHz, 1 channel, 16-bit = 2 bytes/sample)
    // 24000 samples/sec * 2 bytes/sample = 48000 bytes/sec
    const audioBuffer = Buffer.from(finalAudioBase64, 'base64');
    const durationSeconds = audioBuffer.length / 48000;
    const durationFrames = Math.ceil(durationSeconds * 30);

    return { audioBase64: finalAudioBase64, wavBase64, durationFrames, audioKey };
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
    const { durationFrames: audioDurationFrames, audioKey: audioKey } = await generateAudio(story, voiceId, videoId);

    // 3. Generate Subtitles
    console.log(`[ContentPipeline] 3. Generating Subtitles...`);
    const subtitles = await generateSubtitles(videoId);

    // Cleanup local audio file
    try {
        const workDir = await resolveWorkDir(videoId);
        const audioPath = path.join(workDir, 'audio.wav');
        if (fs.existsSync(audioPath)) {
            await fs.promises.unlink(audioPath);
            console.log(`[ContentPipeline] Cleaned up local audio file: ${audioPath}`);
        }
    } catch (cleanupErr) {
        console.warn(`[ContentPipeline] Failed to cleanup audio file:`, cleanupErr);
    }

    // 4. Reconstruct Story from Subtitles (Ground Truth)
    const groundTruthStory = reconstructStoryFromSubtitles(subtitles);
    console.log(`[ContentPipeline] 4. Reconstructed Story: ${groundTruthStory.substring(0, 50)}...`);

    // 5. Segment Story
    console.log(`[ContentPipeline] 5. Segmenting Story...`);
    const segmenter = createSegmenter();
    const segmenterOutput = await runSingleAgent<SegmenterOutput>(segmenter, JSON.stringify(subtitles));

    // 6. Visualizer
    console.log(`[ContentPipeline] 6. Generating Visuals...`);
    let segments = segmenterOutput.segments;

    // Post-processing segments for duration and alignment
    if (segments.length > 0) {
        // Force first segment to start at 0
        segments[0].start = 0;

        // Bridge gaps between segments to ensure continuous video flow
        for (let i = 0; i < segments.length - 1; i++) {
            const currentSeg = segments[i];
            const nextSeg = segments[i + 1];

            // If there is a gap (or slight overlap), snap current end to next start
            // This ensures no duration is lost to silence between segments
            if (currentSeg.end < nextSeg.start) {
                currentSeg.end = nextSeg.start;
            }
        }

        // Adjust last segment to match total audio duration + buffer
        const lastSegment = segments[segments.length - 1];

        // Calculate missing frames from end of last segment to end of audio
        const missingFrames = Math.max(0, audioDurationFrames - lastSegment.end);

        // Add missing frames + 15 extra frames for safety trimming
        lastSegment.end += missingFrames + 15;

        // Recalculate durations for all segments (including the expanded last segment)
        segments = segments.map(s => {
            const duration = (s.end - s.start) / 30;
            return {
                ...s,
                duration: parseFloat(duration.toFixed(2))
            };
        });

        const finalLastSeg = segments[segments.length - 1];
        console.log(`[ContentPipeline] Refined Last Segment: end=${finalLastSeg.end}, duration=${finalLastSeg.duration}s`);
    }

    // Map simplified segments to ScriptSegment type (add empty visualPrompt)
    let scriptSegments = segments.map(s => ({
        ...s,
        visualPrompt: "",
        duration: s.duration || 0 // Ensure duration is a number
    }));

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
        subtitles: subtitles || [],
        audioKey: audioKey
    };

    // Save final script
    try {
        const workDir = await resolveWorkDir(videoId);
        const scriptPath = path.join(workDir, 'script.json');

        try {
            await fs.promises.unlink(scriptPath);
        } catch (err) {
            // Ignore if file doesn't exist
        }

        await writeToFile(workDir, 'script.json', JSON.stringify(scriptContent, null, 2));
        console.log(`[ContentPipeline] Saved local script to: ${scriptPath}`);
    } catch (err) {
        console.error(`[ContentPipeline] Failed to save local script file:`, err);
    }

    return {
        script: scriptContent,
    };
};

/**
 * Orchestrator Pipeline - From Pre-Generated Story (Editor Mode)
 * Skips story generation and uses the provided story directly
 */
export const runContentPipelineFromStory = async (videoId: string, story: string, voiceId: string = DEFAULT_VOICE) => {
    console.log(`[ContentPipeline] Starting flow from pre-generated story for Video ${videoId}`);

    // 1. Skip story generation - use provided story
    console.log(`[ContentPipeline] 1. Using pre-generated story: ${story.substring(0, 50)}...`);

    // 2. Generate Audio
    console.log(`[ContentPipeline] 2. Generating Audio...`);
    const { durationFrames: audioDurationFrames, audioKey: audioKey } = await generateAudio(story, voiceId, videoId);

    // 3. Generate Subtitles
    console.log(`[ContentPipeline] 3. Generating Subtitles...`);
    const subtitles = await generateSubtitles(videoId);

    // Cleanup local audio file
    try {
        const workDir = await resolveWorkDir(videoId);
        const audioPath = path.join(workDir, 'audio.wav');
        if (fs.existsSync(audioPath)) {
            await fs.promises.unlink(audioPath);
            console.log(`[ContentPipeline] Cleaned up local audio file: ${audioPath}`);
        }
    } catch (cleanupErr) {
        console.warn(`[ContentPipeline] Failed to cleanup audio file:`, cleanupErr);
    }

    // 4. Reconstruct Story from Subtitles (Ground Truth)
    const groundTruthStory = reconstructStoryFromSubtitles(subtitles);
    console.log(`[ContentPipeline] 4. Reconstructed Story: ${groundTruthStory.substring(0, 50)}...`);

    // 5. Segment Story
    console.log(`[ContentPipeline] 5. Segmenting Story...`);
    const segmenter = createSegmenter();
    const segmenterOutput = await runSingleAgent<SegmenterOutput>(segmenter, JSON.stringify(subtitles));

    // 6. Visualizer
    console.log(`[ContentPipeline] 6. Generating Visuals...`);
    let segments = segmenterOutput.segments;

    // Post-processing segments for duration and alignment
    if (segments.length > 0) {
        // Force first segment to start at 0
        segments[0].start = 0;

        // Bridge gaps between segments to ensure continuous video flow
        for (let i = 0; i < segments.length - 1; i++) {
            const currentSeg = segments[i];
            const nextSeg = segments[i + 1];

            // If there is a gap (or slight overlap), snap current end to next start
            if (currentSeg.end < nextSeg.start) {
                currentSeg.end = nextSeg.start;
            }
        }

        // Adjust last segment to match total audio duration + buffer
        const lastSegment = segments[segments.length - 1];

        // Calculate missing frames from end of last segment to end of audio
        const missingFrames = Math.max(0, audioDurationFrames - lastSegment.end);

        // Add missing frames + 15 extra frames for safety trimming
        lastSegment.end += missingFrames + 15;

        // Recalculate durations for all segments
        segments = segments.map(s => {
            const duration = (s.end - s.start) / 30;
            return {
                ...s,
                duration: parseFloat(duration.toFixed(2))
            };
        });

        const finalLastSeg = segments[segments.length - 1];
        console.log(`[ContentPipeline] Refined Last Segment: end=${finalLastSeg.end}, duration=${finalLastSeg.duration}s`);
    }

    // Map simplified segments to ScriptSegment type (add empty visualPrompt)
    let scriptSegments = segments.map(s => ({
        ...s,
        visualPrompt: "",
        duration: s.duration || 0
    }));

    const visualizer = createVisualizer();
    const visualizerOutput = await runSingleAgent<VisualizerOutput>(visualizer, JSON.stringify({ segments: scriptSegments }));

    // Merge visual prompts back into our aligned segments
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
        subtitles: subtitles || [],
        audioKey: audioKey
    };

    // Save final script
    try {
        const workDir = await resolveWorkDir(videoId);
        const scriptPath = path.join(workDir, 'script.json');

        try {
            await fs.promises.unlink(scriptPath);
        } catch (err) {
            // Ignore if file doesn't exist
        }

        await writeToFile(workDir, 'script.json', JSON.stringify(scriptContent, null, 2));
        console.log(`[ContentPipeline] Saved local script to: ${scriptPath}`);
    } catch (err) {
        console.error(`[ContentPipeline] Failed to save local script file:`, err);
    }

    return {
        script: scriptContent,
    };
};

export { LlmAgent, SequentialAgent };
