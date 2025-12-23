import { db } from "./index.js";
import { ttsVoice } from "./schema.js";
import { eq } from "drizzle-orm";

const voices = [
    { filename: "en_emma_woman_vibevoice0.5b.wav" },
    { filename: "en_frank_man_vibevoice0.5b.wav" },
    { filename: "en_grace_woman_vibevoice0.5b.wav" },
    { filename: "en_davis_man_vibevoice0.5b.wav" },
    { filename: "en_mike_man_vibevoice0.5b.wav" },
    { filename: "en_carter_man_vibevoice0.5b.wav" },
];

async function seedVoices() {
    console.log("🌱 Seeding TTS voices...");

    for (const voice of voices) {
        const parts = voice.filename.split('_');
        const slug = parts[1];
        const name = slug.charAt(0).toUpperCase() + slug.slice(1);
        const gender = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);

        const voiceData = {
            id: slug,
            provider: "VIBEVOICE",
            providerVoiceId: voice.filename,
            name: name,
            gender: gender,
            languageCode: "en",
            previewUrl: `/assets/voices/${voice.filename}`,
            isActive: true,
        };

        const existing = await db.select().from(ttsVoice).where(eq(ttsVoice.id, slug));

        if (existing.length === 0) {
            await db.insert(ttsVoice).values(voiceData);
            console.log(`✅ Added voice: ${name} (${gender})`);
        } else {
            // Update existing
            await db.update(ttsVoice).set(voiceData).where(eq(ttsVoice.id, slug));
            console.log(`🔄 Updated voice: ${name} (${gender})`);
        }
    }

    console.log("✅ Seeding complete.");
    process.exit(0);
}

seedVoices().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
