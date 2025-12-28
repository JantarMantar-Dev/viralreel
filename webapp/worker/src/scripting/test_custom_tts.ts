
import { createAudioGenerator } from './agents.js';
import { InMemoryRunner } from '@google/adk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTTS() {
    console.log("Starting TTS Integration Test...");

    // Test 1: Plain Text
    const audioGenerator = createAudioGenerator({ ttsVoice: 'Zephyr' });
    const runner = new InMemoryRunner({
        agent: audioGenerator,
        appName: 'test-tts'
    });

    const session = await runner.sessionService.createSession({
        appName: 'test-tts',
        userId: 'test-user'
    });

    console.log("Testing with plain text...");
    const eventGenerator = runner.runAsync({
        userId: session.userId,
        sessionId: session.id,
        newMessage: { role: 'user', parts: [{ text: "Hello, this is a test of the integrated custom Gemini TTS model." }] }
    });

    let audioFound = false;
    for await (const event of eventGenerator) {
        if (event.author === 'audio_generator' && event.content?.parts) {
            for (const part of event.content.parts as any[]) {
                if (part.inlineData?.data) {
                    console.log(`✅ Success: Received audio data (length: ${part.inlineData.data.length})`);
                    audioFound = true;
                }
            }
        }
    }

    if (!audioFound) {
        console.error("❌ Failed: No audio data received for plain text.");
    }

    // Test 2: JSON Script (Simulating Agent Output)
    console.log("\nTesting with JSON script...");
    const scriptJson = JSON.stringify({
        segments: [
            { dialogue: "First segment of the story." },
            { dialogue: "Second segment of the story." }
        ]
    });

    const session2 = await runner.sessionService.createSession({
        appName: 'test-tts',
        userId: 'test-user'
    });

    const eventGenerator2 = runner.runAsync({
        userId: session2.userId,
        sessionId: session2.id,
        newMessage: { role: 'user', parts: [{ text: scriptJson }] }
    });

    audioFound = false;
    for await (const event of eventGenerator2) {
        if (event.author === 'audio_generator' && event.content?.parts) {
            for (const part of event.content.parts as any[]) {
                if (part.inlineData?.data) {
                    console.log(`✅ Success: Received audio data from JSON script (length: ${part.inlineData.data.length})`);
                    audioFound = true;
                }
            }
        }
    }

    if (!audioFound) {
        console.error("❌ Failed: No audio data received for JSON script.");
    }
}

testTTS().catch(console.error);
