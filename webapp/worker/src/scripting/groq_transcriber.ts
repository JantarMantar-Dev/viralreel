
import fs from "fs";
import Groq from "groq-sdk";
import { SubtitleWord } from "./types.js";

export class GroqTranscriber {
    private client: Groq;

    constructor(apiKey: string) {
        this.client = new Groq({ apiKey });
    }

    async transcribe(audioInput: string | Buffer): Promise<SubtitleWord[]> {
        let fileStream: fs.ReadStream | File;

        // If input is a file path
        if (typeof audioInput === 'string' && fs.existsSync(audioInput)) {
            fileStream = fs.createReadStream(audioInput);
        } else {
            // Check if it's a buffer (this might need writing to a temp file because groq sdk expects a file-like object or stream from fs)
            // For now, let's assume it handles file paths primarily as that's safer with the current SDK usage in the example.
            // If we receive a buffer, we might need to write it to a value.
            throw new Error("GroqTranscriber currently supports file paths only.");
        }

        try {
            const transcription = await this.client.audio.transcriptions.create({
                file: fileStream,
                model: "whisper-large-v3-turbo",
                response_format: "verbose_json",
                timestamp_granularities: ["word"],
                language: "en",
            });

            if ('words' in transcription && Array.isArray((transcription as any).words)) {
                return (transcription as any).words.map((w: any) => ({
                    text: w.word,
                    start: w.start * 30, // Convert to frames logic should be consistent, but maybe keep as seconds here? 
                    // The Schema expects frames based on previous code `start: w.start * 30`. 
                    // Wait, previous code `subtitle_generator` in agents.ts produced frames.
                    // Let me double check `types.ts` or usage.
                    // In Agents.ts: "start": The start time in video frames (assuming 30fps).
                    // So yes, * 30 is correct if the input is seconds.
                    end: w.end * 30
                }));
            }

            return [];
        } catch (error) {
            console.error("Groq Transcription Error:", error);
            throw error;
        }
    }
}
