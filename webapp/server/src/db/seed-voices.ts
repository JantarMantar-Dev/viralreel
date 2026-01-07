import { db } from "./index.js";
import { ttsVoice } from "./schema.js";
import { eq } from "drizzle-orm";

const voices = [
    { id: "Achernar", gender: "Female", filename: "gemini_achernar.wav" },
    { id: "Achird", gender: "Male", filename: "gemini_achird.wav" },
    { id: "Algenib", gender: "Male", filename: "gemini_algenib.wav" },
    { id: "Algieba", gender: "Male", filename: "gemini_algieba.wav" },
    { id: "Alnilam", gender: "Male", filename: "gemini_alnilam.wav" },
    { id: "Aoede", gender: "Female", filename: "gemini_aoede.wav" },
    { id: "Autonoe", gender: "Female", filename: "gemini_autonoe.wav" },
    { id: "Callirrhoe", gender: "Female", filename: "gemini_callirrhoe.wav" },
    { id: "Charon", gender: "Male", filename: "gemini_charon.wav" },
    { id: "Despina", gender: "Female", filename: "gemini_despina.wav" },
    { id: "Enceladus", gender: "Male", filename: "gemini_enceladus.wav" },
    { id: "Erinome", gender: "Female", filename: "gemini_erinome.wav" },
    { id: "Fenrir", gender: "Male", filename: "gemini_fenrir.wav" },
    { id: "Gacrux", gender: "Female", filename: "gemini_gacrux.wav" },
    { id: "Iapetus", gender: "Male", filename: "gemini_iapetus.wav" },
    { id: "Kore", gender: "Female", filename: "gemini_kore.wav" },
    { id: "Laomedeia", gender: "Female", filename: "gemini_laomedeia.wav" },
    { id: "Leda", gender: "Female", filename: "gemini_leda.wav" },
    { id: "Orus", gender: "Male", filename: "gemini_orus.wav" },
    { id: "Puck", gender: "Male", filename: "gemini_puck.wav" },
    { id: "Pulcherrima", gender: "Female", filename: "gemini_pulcherrima.wav" },
    { id: "Rasalgethi", gender: "Male", filename: "gemini_rasalgethi.wav" },
    { id: "Sadachbia", gender: "Male", filename: "gemini_sadachbia.wav" },
    { id: "Sadaltager", gender: "Male", filename: "gemini_sadaltager.wav" },
    { id: "Schedar", gender: "Male", filename: "gemini_schedar.wav" },
    { id: "Sulafat", gender: "Female", filename: "gemini_sulafat.wav" },
    { id: "Umbriel", gender: "Male", filename: "gemini_umbriel.wav" },
    { id: "Vindemiatrix", gender: "Female", filename: "gemini_vindemiatrix.wav" },
    { id: "Zephyr", gender: "Female", filename: "gemini_zephyr.wav" },
    { id: "Zubenelgenubi", gender: "Male", filename: "gemini_zubenelgenubi.wav" },
];

async function seedVoices() {
    console.log("🌱 Seeding TTS voices...");

    for (const voice of voices) {
        const name = voice.id;
        const gender = voice.gender;

        const voiceData = {
            id: voice.id,
            provider: "GEMINI",
            providerVoiceId: voice.id,
            name: name,
            gender: gender,
            languageCode: "en",
            previewUrl: `pub/appclient/voices/${voice.filename}`,
            isActive: true,
        };

        await db.insert(ttsVoice)
            .values(voiceData)
            .onConflictDoUpdate({
                target: ttsVoice.id,
                set: voiceData
            });

        console.log(`✅ Seeded voice: ${name} (${gender})`);
    }

    console.log("✅ Seeding complete.");
    process.exit(0);
}

seedVoices().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
