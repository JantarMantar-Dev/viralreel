
import { bundle } from '@remotion/bundler';
import { getCompositions, renderStill } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { SUBTITLE_STYLES } from '../src/remotion/templates/tests/styles';

const main = async () => {
    console.log("🚀 Starting Subtitle Style Test...");

    const entryPoint = path.join(process.cwd(), 'webapp/worker/src/remotion/Root.tsx');
    console.log(`Entry point: ${entryPoint}`);

    console.log("Bundling...");
    const bundleLocation = await bundle({
        entryPoint,
        // No webpack override needed for standard CSS
    });
    console.log(`Bundled to: ${bundleLocation}`);

    const compositions = await getCompositions(bundleLocation);
    const composition = compositions.find((c) => c.id === 'tailwind-test');

    if (!composition) {
        throw new Error('Composition "tailwind-test" not found');
    }

    const outputDir = path.join(process.cwd(), 'out/test-styles');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Found composition ${composition.id}. Rendering styles...`);

    for (const styleName of Object.keys(SUBTITLE_STYLES)) {
        const style = SUBTITLE_STYLES[styleName];
        console.log(`Rendering style: ${style.name}...`);

        try {
            const inputProps = {
                style: style.style,
                previewText: style.previewText,
                name: style.name
            };

            await renderStill({
                composition,
                serveUrl: bundleLocation,
                output: path.join(outputDir, `${style.name.replace(/\s+/g, '-').toLowerCase()}.png`),
                inputProps,
            });
            console.log(`✅ Rendered ${style.name}`);
        } catch (err) {
            console.error(`❌ Failed to render ${style.name}:`, err);
        }
    }

    console.log(`🎉 All styles rendered to ${outputDir}`);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
