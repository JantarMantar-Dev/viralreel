
import { addWavHeader } from './utils.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWavHeader() {
    console.log("Starting WAV Header Test...");

    // Create a dummy PCM buffer (e.g., 1 second of silence at 24kHz, 16-bit, mono)
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const duration = 1; // second
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const dataSize = byteRate * duration;

    const pcmData = Buffer.alloc(dataSize); // Silence

    console.log(`Generating ${dataSize} bytes of dummy PCM data...`);

    const wavData = addWavHeader(pcmData, sampleRate, numChannels, bitsPerSample);

    console.log(`WAV Data length: ${wavData.length} (Expected: ${dataSize + 44})`);

    // Verify RIFF header
    const chunkId = wavData.subarray(0, 4).toString();
    const format = wavData.subarray(8, 12).toString();
    const subchunk1Id = wavData.subarray(12, 16).toString();
    const audioFormat = wavData.readUInt16LE(20);
    const numChannelsRead = wavData.readUInt16LE(22);
    const sampleRateRead = wavData.readUInt32LE(24);
    const bitsPerSampleRead = wavData.readUInt16LE(34);

    if (chunkId === 'RIFF' && format === 'WAVE' && subchunk1Id === 'fmt ') {
        console.log("✅ Header Verification Passed: RIFF/WAVE/fmt found.");
    } else {
        console.error("❌ Header Verification Failed.");
        console.log(`ChunkID: ${chunkId}, Format: ${format}, Subchunk1ID: ${subchunk1Id}`);
    }

    if (audioFormat === 1 && numChannelsRead === numChannels && sampleRateRead === sampleRate && bitsPerSampleRead === bitsPerSample) {
        console.log("✅ Format Verification Passed: PCM, Channels, SampleRate match.");
    } else {
        console.error("❌ Format Verification Failed.");
        console.log(`AudioFormat: ${audioFormat}, Channels: ${numChannelsRead}, SampleRate: ${sampleRateRead}, Bits: ${bitsPerSampleRead}`);
    }

    // Write to file for manual inspection if needed
    // const outputPath = path.join(__dirname, 'test_audio_header_output.wav');
    // fs.writeFileSync(outputPath, wavData);
    // console.log(`Saved test file to: ${outputPath}`);
}

testWavHeader().catch(console.error);
