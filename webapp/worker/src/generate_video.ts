import 'dotenv/config';
import { db } from './db/index.js';
import { contentNiche, imageStyle, subtitleStyle, video, renderJob, user, series } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';


// --- Constants / Seed Data ---

const NICHES = [
    { id: 'true-crime', name: 'True Crime', description: 'Deep dives into mysterious cases, cold investigations, and detective stories.', tags: 'mystery, documentary, investigation', iconName: 'Fingerprint', scriptPrompt: 'Act as a seasoned investigative journalist. Write a gripping, suspenseful script about a real-life mystery. Focus on the timeline, the evidence, and the unsettling details that keep people awake at night. Use a somber, serious tone with dramatic pauses.', videoPrompt: 'Cinematic, dramatic lighting, high contrast, documentary style, realistic textures, moody atmosphere.' },
    { id: 'scary-stories', name: 'Scary Stories', description: 'Horror tales, creepypastas, and supernatural events narration.', tags: 'horror, fiction, scary', iconName: 'Skull', scriptPrompt: 'Act as a master of horror storytelling. Write a bone-chilling creepypasta or a supernatural encounter. Use descriptive, sensory language to build an atmosphere of dread. Include sudden shifts in tension and a lingering, haunting conclusion.', videoPrompt: 'Dark, eerie, atmospheric horror, unsettling shadows, hyper-realistic, volumetric lighting, fog effects.' },
    { id: 'history-facts', name: 'History & Facts', description: 'Educational content about historical events, ancient civilizations, and fun facts.', tags: 'education, learning, history', iconName: 'History', scriptPrompt: 'Act as a charismatic history professor. Narrate a significant historical event or an obscure but fascinating historical fact. Focus on the \'why\' and the human impact, making the past feel alive and relevant. Use an engaging, educational tone.', videoPrompt: 'Epic historical recreations, rich color palettes, authentic period details, educational and majestic.' },
    { id: 'science-tech', name: 'Science & Tech', description: 'Latest innovations, space discoveries, and futuristic concepts.', tags: 'future, technology, science', iconName: 'Beaker', scriptPrompt: 'Act as a visionary tech communicator. Explain a cutting-edge scientific discovery or a futuristic technology. Break down complex concepts into exciting, digestible insights that inspire wonder about the future. Use an optimistic and energetic tone.', videoPrompt: 'Futuristic, high-tech, sleek, 3D renders, neon accents, clean aesthetics, space exploration themes.' },
    { id: 'motivation', name: 'Motivation', description: 'Inspirational speeches, life advice, and personal growth content.', tags: 'lifestyle, growth, motivation', iconName: 'Zap', scriptPrompt: 'Act as a high-impact motivational speaker. Write a powerful speech centered on overcoming adversity, discipline, or personal growth. Use rhythmic phrasing, strong metaphors, and a crescendo of emotional intensity to inspire action.', videoPrompt: 'Inspirational, bright lighting, dynamic movement, emotionally resonant, cinematic landscapes, uplifting.' },
    { id: 'business-finance', name: 'Business & Finance', description: 'Market analysis, entrepreneurship tips, and money management.', tags: 'money, startup, finance', iconName: 'TrendingUp', scriptPrompt: 'Act as a savvy financial analyst. Discuss market trends, entrepreneurship, or wealth-building strategies. Provide clear, actionable insights with a focus on logic, strategy, and long-term success. Use a professional and authoritative tone.', videoPrompt: 'Professional, clean, high-end corporate style, data visualizations, military quality, sophisticated lighting, authoritative.' },
    { id: 'mindblowing-facts', name: 'Mindblowing Facts', description: 'Extraordinary facts that challenge common knowledge or reveal hidden wonders.', tags: 'facts, wonder, mindblowing', iconName: 'Lightbulb', scriptPrompt: 'Act as a curator of the extraordinary. Present a series of "did you know" facts that challenge common knowledge or reveal the hidden wonders of the world. Keep the pacing fast, the tone enthusiastic, and the focus on the "wow" factor.', videoPrompt: 'Vibrant, fast-paced, high energy, colorful, surprising visuals, high-quality stock footage style.' },
    { id: 'mysteries-unsolved', name: 'Mysteries & Unsolved', description: 'Explore unexplained phenomena, missing person cases, or bizarre anomalies.', tags: 'mystery, unsolved, paranormal', iconName: 'Search', scriptPrompt: 'Act as a narrator for a documentary on the unknown. Explore unexplained phenomena, missing person cases, or bizarre anomalies. Focus on the theories, the unanswered questions, and the sense of wonder or fear associated with the unknown.', videoPrompt: 'Mysterious, low key lighting, grainy texture, suspenseful, conceptual art style, intriguing and dark.' }
];

const IMAGE_STYLES = [
    { id: "comic", name: "Comic", description: "Bold comic-book style, thick outlines", promptModifier: ", comic book style, thick outlines, bold colors, graphic novel aesthetic" },
    { id: "creepy-comic", name: "Creepy Comic", description: "Horror-comic style, exaggerated shades", promptModifier: ", horror comic style, dark shadows, exaggerated expressions, eerie atmosphere" },
    { id: "painting", name: "Painting", description: "Detailed traditional painting style", promptModifier: ", traditional oil painting, brush strokes, canvas texture, detailed artistic style" },
    { id: "ghibli", name: "Ghibli", description: "Studio Ghibli-inspired, soft colors", promptModifier: ", studio ghibli style, anime background art, soft colors, lush environments, hayao miyazaki style" },
    { id: "anime", name: "Anime", description: "Clean anime style, sharp linework", promptModifier: ", anime style, sharp linework, vibrant cel shading, japanese animation" },
    { id: "dark-fantasy", name: "Dark Fantasy", description: "Moody atmosphere, dark colors", promptModifier: ", dark fantasy art, moody atmosphere, grimdark, eldritch, mystical" },
    { id: "lego", name: "Lego", description: "Plastic texture, LEGO figure style", promptModifier: ", lego style, plastic texture, depth of field, tilt shift, toy photography" },
    { id: "polaroid", name: "Polaroid", description: "Vintage Polaroid style, soft glow", promptModifier: ", vintage polaroid photo, soft glow, film grain, nostalgic, instant camera aesthetic" },
    { id: "disney", name: "Disney", description: "Classic animation style, soft curves", promptModifier: ", disney animation style, soft curves, expressive characters, magical atmosphere" },
    { id: "realism", name: "Realism", description: "Ultra-realistic photographic style", promptModifier: ", photorealistic, 8k, highly detailed, cinematic lighting, photography" },
    { id: "fantastic", name: "Fantastic", description: "Vibrant magical fantasy style", promptModifier: ", magical fantasy, vibrant colors, sparkles, dreamlike, ethereal" },
];

const SUBTITLE_STYLES = [
    { name: "Classic CapCut", description: "The viral standard", previewText: "EPIC", css: "font-sans font-black text-white stroke-black drop-shadow-[0_2px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-tight leading-none" },
    { name: "Bold Impact", description: "High retention", previewText: "WAR", css: "font-sans font-black text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-normal" },
    { name: "Neon Glow", description: "Cyberpunk vibe", previewText: "LIT", css: "font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase text-4xl tracking-widest" },
    { name: "Minimal Clean", description: "Modern aesthetic", previewText: "Clean", css: "font-sans font-medium text-slate-900 bg-white/90 px-3 py-1 rounded-lg text-2xl tracking-wide lowercase" },
    { name: "Gradient Pop", description: "Colorful energy", previewText: "VIBE", css: "font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm uppercase text-4xl tracking-tighter" },
    { name: "Comic Book", description: "Fun & Engaging", previewText: "POW!", css: "font-sans font-extrabold text-white text-4xl tracking-wide uppercase drop-shadow-[3px_3px_0_#000] -rotate-3" },
    { name: "Typewriter", description: "Storytelling focus", previewText: "typing...", css: "font-mono font-medium text-green-400 bg-black/80 px-4 py-2 rounded-sm text-xl tracking-tight" },
    { name: "MrBeast Style", description: "Maximum attention", previewText: "HUGE", css: "font-sans font-black text-white text-5xl tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] stroke-[3px] stroke-black" },
    { name: "Karaoke", description: "Sing-along style", previewText: "Sing", css: "font-sans font-bold text-purple-300 text-3xl tracking-normal capitalize drop-shadow-md" }
];

// --- Helpers ---

const TEST_USER_ID = "test-user";

async function ensureSeedData(): Promise<string> {
    console.log("Checking seed data...");

    // Niches
    for (const n of NICHES) {
        const existing = await db.select().from(contentNiche).where(eq(contentNiche.id, n.id)).limit(1);
        if (existing.length === 0) {
            await db.insert(contentNiche).values({
                ...n
            });
        }
    }

    // Image Styles
    for (const s of IMAGE_STYLES) {
        // Check by ID if provided, otherwise name (for consistency with my previous logic, but now I have IDs)
        const checkId = s.id || uuidv4(); // Should always have ID now
        const existing = await db.select().from(imageStyle).where(eq(imageStyle.id, checkId)).limit(1);
        if (existing.length === 0) {
            // Also check by name to avoid duplicates if ID is generated (though here hardcoded)
            const existingByName = await db.select().from(imageStyle).where(eq(imageStyle.name, s.name)).limit(1);
            if (existingByName.length === 0) {
                await db.insert(imageStyle).values({
                    ...s,
                    id: s.id || uuidv4()
                });
            }
        }
    }

    // Subtitle Styles
    for (const s of SUBTITLE_STYLES) {
        const existing = await db.select().from(subtitleStyle).where(eq(subtitleStyle.name, s.name)).limit(1);
        if (existing.length === 0) {
            const uniqueId = uuidv4();
            await db.insert(subtitleStyle).values({
                id: uniqueId,
                ...s
            });
        }
    }

    // Ensure test user exists
    let finalUserId = TEST_USER_ID;
    const existingUser = await db.select().from(user).where(eq(user.id, TEST_USER_ID)).limit(1);
    if (existingUser.length > 0) {
        finalUserId = existingUser[0].id;
    } else {
        // Check by email to avoid unique constraint error
        const existingByEmail = await db.select().from(user).where(eq(user.email, "test@example.com")).limit(1);
        if (existingByEmail.length > 0) {
            finalUserId = existingByEmail[0].id;
            console.log(`Found existing user by email: ${finalUserId}`);
        } else {
            console.log(`Creating new test user: ${TEST_USER_ID}`);
            await db.insert(user).values({
                id: TEST_USER_ID,
                name: "Test User",
                email: "test@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            finalUserId = TEST_USER_ID;
        }
    }

    console.log("Seed data check complete.");
    return finalUserId;
}

async function getRandomItem<T>(table: any): Promise<T> {
    const items = await db.select().from(table);
    if (items.length === 0) throw new Error(`No items found in table`);
    return items[Math.floor(Math.random() * items.length)] as T;
}

// --- Commands ---

async function generateNewVideo(options: { segments: number, duration: number, scriptIdea?: string }) {
    const userId = await ensureSeedData();

    const randomNiche = await getRandomItem<typeof contentNiche.$inferSelect>(contentNiche);
    const randomImageStyle = await getRandomItem<typeof imageStyle.$inferSelect>(imageStyle);
    const randomSubtitleStyle = await getRandomItem<typeof subtitleStyle.$inferSelect>(subtitleStyle);

    console.log(`Selected Params:
    Niche: ${randomNiche.name}
    Image Style: ${randomImageStyle.name}
    Subtitle Style: ${randomSubtitleStyle.name}
    Script Idea: ${options.scriptIdea || "None"}`);

    const seriesId = uuidv4();
    await db.insert(series).values({
        id: seriesId,
        userId: userId,
        name: `Generated Series - ${new Date().toISOString()}`,
        nicheId: randomNiche.id,
    });

    const videoId = uuidv4();
    await db.insert(video).values({
        id: videoId,
        userId: userId,
        seriesId: seriesId,
        nicheId: randomNiche.id,
        title: `Auto Generated Video ${new Date().toISOString()}`,
        status: "QUEUED", // Initial status
        metadata: {
            duration: options.duration / 60, // Store in minutes, input is seconds
            segments: options.segments,
            visualFormat: "image",
            visualStyle: randomImageStyle.id,
            subtitleStyleId: randomSubtitleStyle.id,
            scriptIdea: options.scriptIdea,
            nicheId: randomNiche.id,
            voiceId: "Zephyr", // Default handled by worker
            musicId: undefined, // Default handled by worker
            aspectRatio: "portrait",
            templateId: "simple",
        }
    });

    const jobId = uuidv4();
    await db.insert(renderJob).values({
        id: jobId,
        videoId: videoId,
        status: "QUEUED",
    });

    console.log(`Created Job ID: ${jobId} for Video ID: ${videoId}`);
    console.log("Workers should pick this up automatically.");
}

async function regenerate(id: string, stage: 'script' | 'image' | 'render') {
    // Determine the new status based on the requested stage
    let newStatus = '';

    // We also need to fetch the renderJob for this video or id.
    // Assuming 'id' is VideoID or JobID. Let's assume VideoID for user convenience, or support both?
    // Let's assume it's Video ID.

    const existingJob = await db.select().from(renderJob).where(eq(renderJob.videoId, id)).limit(1);
    let jobId = '';

    if (existingJob.length === 0) {
        // Create new job if for some reason it's missing but video exists
        jobId = uuidv4();
        await db.insert(renderJob).values({
            id: jobId,
            videoId: id,
            status: "QUEUED" // Placeholder
        });
    } else {
        jobId = existingJob[0].id;
    }

    if (stage === 'script') {
        newStatus = 'QUEUED'; // Go back to very beginning
    } else if (stage === 'image') {
        newStatus = 'SCRIPT_READY'; // Skip scripting, go to asset gen
    } else if (stage === 'render') {
        newStatus = 'AI_ASSET_GEN_COMPLETED'; // Skip asset gen, go to video render
    }

    await db.update(renderJob)
        .set({
            status: newStatus,
            workerId: null, // Release from any worker
            error: null,
            progress: 0
        })
        .where(eq(renderJob.id, jobId));

    console.log(`Reset Job ${jobId} (Video ${id}) to status: ${newStatus}`);
}

// --- Manual Argument Parsing ---

async function main() {
    const args = process.argv.slice(2);
    const options: any = {
        segments: 4,
        duration: 30
    };

    // Simple parsing
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--segments' || arg === '-s') {
            options.segments = parseInt(args[++i]);
        } else if (arg === '--duration' || arg === '-d') {
            options.duration = parseInt(args[++i]);
        } else if (arg === '--script-idea') {
            options.scriptIdea = args[++i];
        } else if (arg === '--regenerate-script') {
            options.regenerateScript = args[++i];
        } else if (arg === '--regenerate-image') {
            options.regenerateImage = args[++i];
        } else if (arg === '--rerender') {
            options.rerender = args[++i];
        }
    }

    try {
        if (options.regenerateScript) {
            await regenerate(options.regenerateScript, 'script');
        } else if (options.regenerateImage) {
            await regenerate(options.regenerateImage, 'image');
        } else if (options.rerender) {
            await regenerate(options.rerender, 'render');
        } else {
            await generateNewVideo({
                segments: options.segments,
                duration: options.duration,
                scriptIdea: options.scriptIdea
            });
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
