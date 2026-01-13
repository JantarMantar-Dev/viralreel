/**
 * Test script to verify subtitle rendering behavior
 * 
 * This test verifies that:
 * 1. Subtitles ARE rendered when subtitleTemplateId is set
 * 2. Subtitles are NOT rendered when subtitleTemplateId is undefined/null
 * 
 * Strategy:
 * - Render two frames: one with subtitleTemplateId, one without
 * - Compare file sizes - the frame with subtitles should be larger due to text rendering
 * - Also visually inspect the output images
 */

import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const TEST_SUBTITLE = { text: "TEST SUBTITLE TEXT", start: 0, end: 30 };

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    outputPath?: string;
    fileSize?: number;
}

const main = async () => {
    console.log("=".repeat(60));
    console.log("Subtitle Condition Test");
    console.log("=".repeat(60));
    console.log("\nThis test verifies that subtitles only render when");
    console.log("subtitleTemplateId is set to a valid template.\n");

    const entryPoint = path.join(process.cwd(), 'src/remotion/Root.tsx');
    console.log(`Entry point: ${entryPoint}`);

    console.log("\n[1/4] Bundling Remotion project...");
    const bundleLocation = await bundle({
        entryPoint,
        webpackOverride: (config) => ({
            ...config,
            resolve: {
                ...config.resolve,
                extensionAlias: {
                    ".js": [".ts", ".tsx", ".js", ".jsx"],
                },
            },
        }),
    });
    console.log(`Bundled to: ${bundleLocation}`);

    const outputDir = path.join(process.cwd(), 'out/test-subtitle-condition');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const results: TestResult[] = [];

    // Base props for all tests
    const baseProps = {
        audioUrl: undefined,
        segments: [
            {
                imageAssetPath: "https://picsum.photos/id/237/1080/1920",
                duration: 5,
            }
        ],
        subtitles: [TEST_SUBTITLE],
        subtitleLocation: 'center' as const,
    };

    console.log("\n[2/4] Running test cases...\n");

    // Test Case 1: WITH subtitleTemplateId - should show subtitles
    console.log("Test 1: WITH subtitleTemplateId (should show subtitles)");
    const withTemplatePath = path.join(outputDir, 'with-template.png');
    try {
        const propsWithTemplate = {
            ...baseProps,
            subtitleTemplateId: 'classic-capcut',
        };
        
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'simple',
            inputProps: propsWithTemplate,
        });
        
        await renderStill({
            composition,
            serveUrl: bundleLocation,
            output: withTemplatePath,
            frame: 15, // Middle of the subtitle timing
            inputProps: propsWithTemplate,
        });
        const stats = fs.statSync(withTemplatePath);
        results.push({
            name: "With subtitleTemplateId",
            passed: true,
            message: `Rendered successfully (${(stats.size / 1024).toFixed(1)} KB)`,
            outputPath: withTemplatePath,
            fileSize: stats.size,
        });
        console.log(`   RENDERED: ${withTemplatePath}`);
        console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err: any) {
        results.push({
            name: "With subtitleTemplateId",
            passed: false,
            message: `Failed to render: ${err.message}`,
        });
        console.log(`   FAILED: ${err.message}`);
    }

    // Test Case 2: WITHOUT subtitleTemplateId - should NOT show subtitles
    console.log("\nTest 2: WITHOUT subtitleTemplateId (should NOT show subtitles)");
    const withoutTemplatePath = path.join(outputDir, 'without-template.png');
    try {
        const propsWithoutTemplate = {
            ...baseProps,
            subtitleTemplateId: undefined, // No template selected
        };
        
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'simple',
            inputProps: propsWithoutTemplate,
        });
        
        await renderStill({
            composition,
            serveUrl: bundleLocation,
            output: withoutTemplatePath,
            frame: 15,
            inputProps: propsWithoutTemplate,
        });
        const stats = fs.statSync(withoutTemplatePath);
        results.push({
            name: "Without subtitleTemplateId",
            passed: true,
            message: `Rendered successfully (${(stats.size / 1024).toFixed(1)} KB)`,
            outputPath: withoutTemplatePath,
            fileSize: stats.size,
        });
        console.log(`   RENDERED: ${withoutTemplatePath}`);
        console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err: any) {
        results.push({
            name: "Without subtitleTemplateId",
            passed: false,
            message: `Failed to render: ${err.message}`,
        });
        console.log(`   FAILED: ${err.message}`);
    }

    // Test Case 3: With INVALID subtitleTemplateId - should NOT show subtitles
    console.log("\nTest 3: With INVALID subtitleTemplateId (should NOT show subtitles)");
    const invalidTemplatePath = path.join(outputDir, 'invalid-template.png');
    try {
        const propsInvalidTemplate = {
            ...baseProps,
            subtitleTemplateId: 'non-existent-template-xyz',
        };
        
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'simple',
            inputProps: propsInvalidTemplate,
        });
        
        await renderStill({
            composition,
            serveUrl: bundleLocation,
            output: invalidTemplatePath,
            frame: 15,
            inputProps: propsInvalidTemplate,
        });
        const stats = fs.statSync(invalidTemplatePath);
        results.push({
            name: "With invalid subtitleTemplateId",
            passed: true,
            message: `Rendered successfully (${(stats.size / 1024).toFixed(1)} KB)`,
            outputPath: invalidTemplatePath,
            fileSize: stats.size,
        });
        console.log(`   RENDERED: ${invalidTemplatePath}`);
        console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err: any) {
        results.push({
            name: "With invalid subtitleTemplateId",
            passed: false,
            message: `Failed to render: ${err.message}`,
        });
        console.log(`   FAILED: ${err.message}`);
    }

    // Test Case 4: With empty string subtitleTemplateId - should NOT show subtitles
    console.log("\nTest 4: With EMPTY STRING subtitleTemplateId (should NOT show subtitles)");
    const emptyTemplatePath = path.join(outputDir, 'empty-template.png');
    try {
        const propsEmptyTemplate = {
            ...baseProps,
            subtitleTemplateId: '',
        };
        
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'simple',
            inputProps: propsEmptyTemplate,
        });
        
        await renderStill({
            composition,
            serveUrl: bundleLocation,
            output: emptyTemplatePath,
            frame: 15,
            inputProps: propsEmptyTemplate,
        });
        const stats = fs.statSync(emptyTemplatePath);
        results.push({
            name: "With empty string subtitleTemplateId",
            passed: true,
            message: `Rendered successfully (${(stats.size / 1024).toFixed(1)} KB)`,
            outputPath: emptyTemplatePath,
            fileSize: stats.size,
        });
        console.log(`   RENDERED: ${emptyTemplatePath}`);
        console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err: any) {
        results.push({
            name: "With empty string subtitleTemplateId",
            passed: false,
            message: `Failed to render: ${err.message}`,
        });
        console.log(`   FAILED: ${err.message}`);
    }

    // Analysis
    console.log("\n[3/4] Analyzing results...\n");
    console.log("=".repeat(60));
    console.log("ANALYSIS");
    console.log("=".repeat(60));

    const withTemplateSize = results.find(r => r.name === "With subtitleTemplateId")?.fileSize || 0;
    const withoutTemplateSize = results.find(r => r.name === "Without subtitleTemplateId")?.fileSize || 0;
    const invalidTemplateSize = results.find(r => r.name === "With invalid subtitleTemplateId")?.fileSize || 0;
    const emptyTemplateSize = results.find(r => r.name === "With empty string subtitleTemplateId")?.fileSize || 0;

    console.log("\nFile Size Comparison:");
    console.log(`  With template:     ${(withTemplateSize / 1024).toFixed(1)} KB`);
    console.log(`  Without template:  ${(withoutTemplateSize / 1024).toFixed(1)} KB`);
    console.log(`  Invalid template:  ${(invalidTemplateSize / 1024).toFixed(1)} KB`);
    console.log(`  Empty template:    ${(emptyTemplateSize / 1024).toFixed(1)} KB`);

    // The image with subtitles should be noticeably different (usually larger due to text)
    const sizeDifference = withTemplateSize - withoutTemplateSize;
    const percentDiff = withoutTemplateSize > 0 ? ((sizeDifference / withoutTemplateSize) * 100).toFixed(1) : '0';

    console.log(`\nSize difference (with vs without): ${(sizeDifference / 1024).toFixed(1)} KB (${percentDiff}%)`);

    // Check if "without" sizes are similar (they should be since none have subtitles)
    const tolerance = 0.1; // 10% tolerance
    const invalidSimilarToWithout = withoutTemplateSize > 0 && Math.abs(invalidTemplateSize - withoutTemplateSize) / withoutTemplateSize < tolerance;
    const emptySimilarToWithout = withoutTemplateSize > 0 && Math.abs(emptyTemplateSize - withoutTemplateSize) / withoutTemplateSize < tolerance;
    const withDifferentFromWithout = withoutTemplateSize > 0 && Math.abs(withTemplateSize - withoutTemplateSize) / withoutTemplateSize > 0.001; // At least 0.1% different

    console.log("\n" + "=".repeat(60));
    console.log("TEST RESULTS");
    console.log("=".repeat(60));

    let allPassed = true;

    // Validate: frame with template should be different from without template
    if (withDifferentFromWithout) {
        console.log("\n[PASS] Frame WITH template is different from frame WITHOUT template");
        console.log("       This indicates subtitles ARE rendered when template is set.");
    } else {
        console.log("\n[FAIL] Frame WITH template is IDENTICAL to frame WITHOUT template");
        console.log("       This may indicate subtitles are not rendering even with a valid template.");
        allPassed = false;
    }

    // Validate: frames without valid template should be similar to each other
    if (invalidSimilarToWithout && emptySimilarToWithout) {
        console.log("\n[PASS] Invalid/empty template frames are similar to 'without template' frame");
        console.log("       This indicates subtitles are NOT rendered for invalid templates.");
    } else {
        console.log("\n[WARN] Frame sizes differ unexpectedly. Please visually inspect the images.");
        allPassed = false;
    }

    // Final summary
    console.log("\n" + "-".repeat(60));
    console.log("[4/4] OUTPUT FILES FOR VISUAL INSPECTION:");
    console.log("-".repeat(60));
    results.forEach(r => {
        if (r.outputPath) {
            console.log(`  ${r.name}:`);
            console.log(`    ${r.outputPath}`);
        }
    });

    console.log("\n" + "=".repeat(60));
    console.log("HOW TO VERIFY:");
    console.log("=".repeat(60));
    console.log("1. Open the output images in the 'out/test-subtitle-condition' folder");
    console.log("2. 'with-template.png' SHOULD show 'TEST SUBTITLE TEXT' in the center");
    console.log("3. 'without-template.png' should show ONLY the background image");
    console.log("4. 'invalid-template.png' should show ONLY the background image");
    console.log("5. 'empty-template.png' should show ONLY the background image");
    console.log("\nIf images 3, 4, 5 show any text, the fix did not work correctly.");
    console.log("=".repeat(60));

    if (allPassed) {
        console.log("\n TEST COMPLETED SUCCESSFULLY");
        process.exit(0);
    } else {
        console.log("\n TEST FAILED - Please verify visually");
        process.exit(1);
    }
};

main().catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
