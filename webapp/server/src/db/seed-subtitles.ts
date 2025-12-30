
import { db } from "./index.js";
import { subtitleStyle } from "./schema.js";
import { randomUUID } from "node:crypto";

const SUBTITLE_STYLES = [
    {
        name: "Classic CapCut",
        description: "The viral standard",
        previewText: "EPIC",
        css: "font-sans font-black text-white stroke-black drop-shadow-[0_2px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-tight leading-none"
    },
    {
        name: "Bold Impact",
        description: "High retention",
        previewText: "WAR",
        css: "font-sans font-black text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-normal"
    },
    {
        name: "Neon Glow",
        description: "Cyberpunk vibe",
        previewText: "LIT",
        css: "font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase text-4xl tracking-widest"
    },
    {
        name: "Minimal Clean",
        description: "Modern aesthetic",
        previewText: "Clean",
        css: "font-sans font-medium text-slate-900 bg-white/90 px-3 py-1 rounded-lg text-2xl tracking-wide lowercase"
    },
    {
        name: "Gradient Pop",
        description: "Colorful energy",
        previewText: "VIBE",
        css: "font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm uppercase text-4xl tracking-tighter"
    },
    {
        name: "Comic Book",
        description: "Fun & Engaging",
        previewText: "POW!",
        css: "font-sans font-extrabold text-white text-4xl tracking-wide uppercase drop-shadow-[3px_3px_0_#000] -rotate-3"
    },
    {
        name: "Typewriter",
        description: "Storytelling focus",
        previewText: "typing...",
        css: "font-mono font-medium text-green-400 bg-black/80 px-4 py-2 rounded-sm text-xl tracking-tight"
    },
    {
        name: "MrBeast Style",
        description: "Maximum attention",
        previewText: "HUGE",
        css: "font-sans font-black text-white text-5xl tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] stroke-[3px] stroke-black"
    },
    {
        name: "Karaoke",
        description: "Sing-along style",
        previewText: "Sing",
        css: "font-sans font-bold text-purple-300 text-3xl tracking-normal capitalize drop-shadow-md"
    },
    {
        name: "Default",
        description: "Standard clean style",
        previewText: "Basic",
        css: "font-sans font-bold text-white drop-shadow-md text-3xl"
    },
    {
        name: "Bold Yellow",
        description: "High visibility style",
        previewText: "BOLD",
        css: "font-sans font-black text-yellow-400 drop-shadow-md uppercase text-3xl"
    },
    {
        name: "Red Outline",
        description: "Distinctive outline style",
        previewText: "Outline",
        css: "font-sans font-black text-transparent [-webkit-text-stroke:2px_red] uppercase text-3xl"
    }
];

export async function seedSubtitles() {
    console.log("🌱 Seeding Subtitle Styles...");

    for (const style of SUBTITLE_STYLES) {
        // Upsert based on name
        await db.insert(subtitleStyle).values({
            id: randomUUID(),
            name: style.name,
            description: style.description,
            previewText: style.previewText,
            css: style.css,
            isActive: true,
        }).onConflictDoUpdate({
            target: subtitleStyle.name,
            set: {
                description: style.description,
                previewText: style.previewText,
                css: style.css,
                isActive: true,
            }
        });
    }

    console.log("✅ Subtitle Styles seeded successfully!");
}

// Execute if run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedSubtitles()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
