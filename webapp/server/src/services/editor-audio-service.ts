import { db } from "../db/index.js";
import { video, ttsVoice } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { storageProvider } from "../lib/storage.js";
import { AppError } from "../lib/errors.js";
import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";

const TTS_MODEL_NAME = process.env.GOOGLE_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// =============================================================================
// TYPES
// =============================================================================

export interface GenerateAudioParams {
    videoId: string;
    userId: string;
    script: string;
    voiceId: string;
    tonePrompt?: string;
}

export interface AudioVersion {
    id: string;
    audioKey: string;
    durationSeconds: number;
    voiceId: string;
    voiceName: string;
    tonePrompt?: string;
    subtitles?: SubtitleWord[]; // Optional - generated separately via transcription step
    generatedAt: string;
}

export interface GenerateAudioResult {
    audioId: string;
    audioKey: string;
    audioUrl: string;
    durationSeconds: number;
    voiceId: string;
    voiceName: string;
    tonePrompt?: string;
    generatedAt: string;
    audioVersions: AudioVersion[];
}

export interface SubtitleWord {
    text: string;
    start: number; // frames at 30fps
    end: number;   // frames at 30fps
}

export interface GetAudioUrlParams {
    videoId: string;
    userId: string;
}

// =============================================================================
// HELPER: Add WAV Header to raw PCM data
// =============================================================================

function addWavHeader(pcmBuffer: Buffer, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Buffer {
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const headerSize = 44;

    const header = Buffer.alloc(headerSize);

    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(dataSize + headerSize - 8, 4); // file size - 8
    header.write('WAVE', 8);

    // fmt subchunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // data subchunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
}

// =============================================================================
// TTS GENERATION (Gemini)
// =============================================================================

async function generateTTSAudio(text: string, voiceName: string): Promise<{ audioBase64: string; durationSeconds: number }> {
    if (!GOOGLE_API_KEY) {
        throw new AppError("ConfigError", "GOOGLE_API_KEY not configured", 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL_NAME}:generateContent?key=${GOOGLE_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voiceName
                    }
                }
            }
        }
    };

    console.log(`[EditorAudioService] Generating TTS with voice: ${voiceName}, model: ${TTS_MODEL_NAME}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[EditorAudioService] Gemini TTS API Error:`, errText);
        throw new AppError("TTSError", `TTS generation failed: ${response.status}`, 500);
    }

    const data = await response.json();

    // Extract audio data
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
        throw new AppError("TTSError", "No audio data in TTS response", 500);
    }

    const audioPart = candidate.content.parts.find((p: any) => p.inlineData);
    if (!audioPart?.inlineData?.data) {
        throw new AppError("TTSError", "No inline audio data found", 500);
    }

    const audioBase64 = audioPart.inlineData.data;

    // Calculate duration (24kHz, 1 channel, 16-bit = 48000 bytes/sec)
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const durationSeconds = audioBuffer.length / 48000;

    console.log(`[EditorAudioService] Generated audio: ${audioBuffer.length} bytes, ${durationSeconds.toFixed(2)}s`);

    return { audioBase64, durationSeconds };
}

// =============================================================================
// TRANSCRIPTION (Groq Whisper)
// =============================================================================

async function transcribeAudio(audioBuffer: Buffer): Promise<SubtitleWord[]> {
    const groqApiKey = process.env.GROQ_TTS_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
        console.error("[EditorAudioService] GROQ_API_KEY not configured");
        throw new AppError(
            "TranscriptionError", 
            "Transcription service is temporarily unavailable. Please try again later.", 
            500
        );
    }

    const groq = new Groq({ apiKey: groqApiKey });

    try {
        // Create a File-like object from the buffer
        // Convert Buffer to Uint8Array for compatibility
        const audioFile = new File([new Uint8Array(audioBuffer)], 'audio.wav', { type: 'audio/wav' });

        console.log(`[EditorAudioService] Transcribing audio with Groq Whisper...`);

        const transcription = await groq.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-large-v3-turbo",
            response_format: "verbose_json",
            timestamp_granularities: ["word"],
            language: "en",
        });

        if ('words' in transcription && Array.isArray((transcription as any).words)) {
            const subtitles: SubtitleWord[] = (transcription as any).words.map((w: any) => ({
                text: w.word,
                start: Math.round(w.start * 30), // Convert seconds to frames (30fps)
                end: Math.round(w.end * 30)
            }));

            // Fix overlaps
            for (let i = 1; i < subtitles.length; i++) {
                const prev = subtitles[i - 1];
                const current = subtitles[i];
                if (current.start < prev.end) {
                    current.start = prev.end + 1;
                    if (current.end <= current.start) {
                        current.end = current.start + 1;
                    }
                }
            }

            console.log(`[EditorAudioService] Generated ${subtitles.length} subtitle words`);
            return subtitles;
        }

        throw new AppError("TranscriptionError", "Transcription failed. Please try again.", 500);
    } catch (error: any) {
        console.error("[EditorAudioService] Groq Transcription Error:", error);
        
        // Re-throw AppErrors as-is
        if (error?.name === 'AppError') {
            throw error;
        }
        
        // Handle specific Groq API errors with user-friendly messages
        if (error?.status === 401 || error?.status === 403) {
            throw new AppError("TranscriptionError", "Transcription service is temporarily unavailable. Please try again later.", 500);
        }
        if (error?.status === 429) {
            throw new AppError("TranscriptionError", "Service is busy. Please try again in a few moments.", 429);
        }
        
        throw new AppError(
            "TranscriptionError", 
            "Transcription failed. Please try again.", 
            500
        );
    }
}

// =============================================================================
// MAIN SERVICE FUNCTIONS
// =============================================================================

/**
 * Generate TTS audio for a video and upload to S3
 * Uses unique keys for each audio version to support versioning
 */
export async function generateAudio(params: GenerateAudioParams): Promise<GenerateAudioResult> {
    const { videoId, userId, script, voiceId, tonePrompt } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    // 2. Get voice name from voiceId
    const voiceRecord = await db.select()
        .from(ttsVoice)
        .where(eq(ttsVoice.id, voiceId))
        .limit(1);

    const voiceName = voiceRecord.length > 0 ? voiceRecord[0].name : "Zephyr";

    // 3. Prepare the text for TTS (optionally include tone prompt)
    let ttsText = script;
    if (tonePrompt) {
        // Prepend tone instructions (some TTS models can interpret this)
        ttsText = `[Speaking style: ${tonePrompt}]\n\n${script}`;
    }

    // 4. Generate TTS audio
    const { audioBase64, durationSeconds } = await generateTTSAudio(ttsText, voiceName);

    // 5. Convert to WAV format
    const pcmBuffer = Buffer.from(audioBase64, 'base64');
    const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);

    // 6. Generate unique audio ID and upload to S3 with unique key
    const audioId = uuidv4();
    const audioKey = `videos/${userId}/${videoId}/audio_${audioId}.wav`;
    await storageProvider.uploadFile(wavBuffer, audioKey, 'audio/wav');
    console.log(`[EditorAudioService] Uploaded audio to S3: ${audioKey}`);

    // 7. Create new audio version object (without subtitles - generated separately)
    const generatedAt = new Date().toISOString();
    const newAudioVersion: AudioVersion = {
        id: audioId,
        audioKey,
        durationSeconds,
        voiceId,
        voiceName,
        tonePrompt,
        // subtitles are NOT included - they will be generated in a separate transcription step
        generatedAt,
    };

    // 8. Get existing audio versions and append new one
    const currentMetadata = (existingVideo[0].metadata as any) || {};
    const existingVersions: AudioVersion[] = currentMetadata.audioVersions || [];
    const updatedVersions = [...existingVersions, newAudioVersion];

    // 9. Update video metadata with new audio as selected (no subtitles yet)
    const updatedMetadata = {
        ...currentMetadata,
        editorMode: true,
        currentPhase: "audio",
        audioKey, // Currently selected audio
        audioDurationSeconds: durationSeconds,
        voiceId,
        voiceName,
        tonePrompt: tonePrompt || undefined,
        // subtitles are NOT set here - they will be set after transcription step
        audioVersions: updatedVersions,
        selectedAudioId: audioId,
        audioGenerationCount: (currentMetadata.audioGenerationCount || 0) + 1,
    };

    await db.update(video)
        .set({
            metadata: updatedMetadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    // 10. Generate signed URL for playback
    const audioUrl = await storageProvider.getSignedUrl(audioKey);

    return {
        audioId,
        audioKey,
        audioUrl,
        durationSeconds,
        voiceId,
        voiceName,
        tonePrompt,
        generatedAt,
        audioVersions: updatedVersions,
    };
}

/**
 * Get signed audio URL for a video
 */
export async function getAudioUrl(params: GetAudioUrlParams): Promise<{ audioUrl: string; durationSeconds: number } | null> {
    const { videoId, userId } = params;

    // Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    const metadata = existingVideo[0].metadata as any;
    if (!metadata?.audioKey) {
        return null;
    }

    const audioUrl = await storageProvider.getSignedUrl(metadata.audioKey);
    return {
        audioUrl,
        durationSeconds: metadata.audioDurationSeconds || 0
    };
}

// =============================================================================
// TRANSCRIPTION GENERATION (Separate Step)
// =============================================================================

export interface GenerateTranscriptionParams {
    videoId: string;
    userId: string;
    audioId: string;  // The ID of the audio version to transcribe
}

export interface GenerateTranscriptionResult {
    success: boolean;
    audioId: string;
    subtitles: SubtitleWord[];
    wordCount: number;
}

/**
 * Generate transcription for a specific audio version
 * This is a separate step from audio generation for better control and error handling
 */
export async function generateTranscription(params: GenerateTranscriptionParams): Promise<GenerateTranscriptionResult> {
    const { videoId, userId, audioId } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    const currentMetadata = (existingVideo[0].metadata as any) || {};
    const audioVersions: AudioVersion[] = currentMetadata.audioVersions || [];

    // 2. Find the audio version to transcribe
    const audioVersionIndex = audioVersions.findIndex(v => v.id === audioId);
    if (audioVersionIndex === -1) {
        throw new AppError("NotFound", "Audio version not found", 404);
    }

    const audioVersion = audioVersions[audioVersionIndex];

    // 3. Download audio from S3
    console.log(`[EditorAudioService] Downloading audio for transcription: ${audioVersion.audioKey}`);
    const audioBuffer = await storageProvider.downloadFile(audioVersion.audioKey);

    if (!audioBuffer) {
        throw new AppError("NotFound", "Audio file not found in storage", 404);
    }

    // 4. Transcribe the audio
    console.log(`[EditorAudioService] Starting transcription for audio version: ${audioId}`);
    const subtitles = await transcribeAudio(audioBuffer);

    if (subtitles.length === 0) {
        throw new AppError("TranscriptionError", "Transcription failed - no words detected. Please try again.", 500);
    }

    // 5. Update the audio version with subtitles
    const updatedAudioVersion: AudioVersion = {
        ...audioVersion,
        subtitles,
    };

    const updatedVersions = [...audioVersions];
    updatedVersions[audioVersionIndex] = updatedAudioVersion;

    // 6. Update video metadata with transcription
    const isSelectedAudio = currentMetadata.selectedAudioId === audioId;
    const updatedMetadata = {
        ...currentMetadata,
        audioVersions: updatedVersions,
        // If this is the currently selected audio, also update the main subtitles
        ...(isSelectedAudio && { subtitles }),
    };

    await db.update(video)
        .set({
            metadata: updatedMetadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    console.log(`[EditorAudioService] Transcription complete: ${subtitles.length} words`);

    return {
        success: true,
        audioId,
        subtitles,
        wordCount: subtitles.length,
    };
}

// =============================================================================
// SAVE EDITED TRANSCRIPTION
// =============================================================================

export interface SaveTranscriptionParams {
    videoId: string;
    userId: string;
    audioId: string;
    subtitles: SubtitleWord[];
}

export interface SaveTranscriptionResult {
    success: boolean;
    audioId: string;
    wordCount: number;
}

/**
 * Save edited transcription for a specific audio version
 */
export async function saveTranscription(params: SaveTranscriptionParams): Promise<SaveTranscriptionResult> {
    const { videoId, userId, audioId, subtitles } = params;

    // 1. Verify video belongs to user
    const existingVideo = await db.select()
        .from(video)
        .where(and(eq(video.id, videoId), eq(video.userId, userId)))
        .limit(1);

    if (existingVideo.length === 0) {
        throw new AppError("NotFound", "Video not found or access denied", 404);
    }

    const currentMetadata = (existingVideo[0].metadata as any) || {};
    const audioVersions: AudioVersion[] = currentMetadata.audioVersions || [];

    // 2. Find the audio version to update
    const audioVersionIndex = audioVersions.findIndex(v => v.id === audioId);
    if (audioVersionIndex === -1) {
        throw new AppError("NotFound", "Audio version not found", 404);
    }

    // 3. Update the audio version with edited subtitles
    const updatedAudioVersion: AudioVersion = {
        ...audioVersions[audioVersionIndex],
        subtitles,
    };

    const updatedVersions = [...audioVersions];
    updatedVersions[audioVersionIndex] = updatedAudioVersion;

    // 4. Update video metadata
    const isSelectedAudio = currentMetadata.selectedAudioId === audioId;
    const updatedMetadata = {
        ...currentMetadata,
        audioVersions: updatedVersions,
        // If this is the currently selected audio, also update the main subtitles
        ...(isSelectedAudio && { subtitles }),
    };

    await db.update(video)
        .set({
            metadata: updatedMetadata,
            updatedAt: new Date()
        })
        .where(eq(video.id, videoId));

    console.log(`[EditorAudioService] Saved edited transcription: ${subtitles.length} words`);

    return {
        success: true,
        audioId,
        wordCount: subtitles.length,
    };
}
