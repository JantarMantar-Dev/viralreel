
import { compressVideo } from '../src/lib/video.js';
import path from 'path';
import fs from 'fs';

async function runTest() {
    const inputPath = path.resolve(process.cwd(), 'testvid.mp4');
    const outputPathAggressive = path.resolve(process.cwd(), 'testvid_compressed_aggressive.mp4');
    const outputPathNormal = path.resolve(process.cwd(), 'testvid_compressed_normal.mp4');

    if (!fs.existsSync(inputPath)) {
        console.error(`Input file not found: ${inputPath}`);
        process.exit(1);
    }

    const inputStats = fs.statSync(inputPath);
    console.log(`Original file size: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Test 1: Aggressive (New Default - CRF 32)
    console.log(`\n--- Test 1: Aggressive Compression (CRF 32, veryfast) ---`);
    console.log(`Compressing to ${outputPathAggressive}...`);
    try {
        if (fs.existsSync(outputPathAggressive)) fs.unlinkSync(outputPathAggressive);

        await compressVideo(inputPath, outputPathAggressive, { crf: 32, preset: 'veryfast' });

        const outputStats = fs.statSync(outputPathAggressive);
        console.log(`Compressed file size: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);

        const reduction = ((inputStats.size - outputStats.size) / inputStats.size) * 100;
        console.log(`Size reduction: ${reduction.toFixed(2)}%`);
    } catch (error) {
        console.error("Test 1 failed:", error);
    }

    // Test 2: Normal (Old Default - CRF 28)
    console.log(`\n--- Test 2: Normal Compression (CRF 28, fast) ---`);
    console.log(`Compressing to ${outputPathNormal}...`);
    try {
        if (fs.existsSync(outputPathNormal)) fs.unlinkSync(outputPathNormal);

        await compressVideo(inputPath, outputPathNormal, { crf: 28, preset: 'fast' });

        const outputStats = fs.statSync(outputPathNormal);
        console.log(`Compressed file size: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);

        const reduction = ((inputStats.size - outputStats.size) / inputStats.size) * 100;
        console.log(`Size reduction: ${reduction.toFixed(2)}%`);
    } catch (error) {
        console.error("Test 2 failed:", error);
    }
}

runTest();
