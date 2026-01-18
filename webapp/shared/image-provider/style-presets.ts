export interface ImageStylePreset {
    name: string; // Display name
    description: string; // For LLM context
    prefix: string;
    suffix: string;
}

export const IMAGE_STYLE_PRESETS: Record<string, ImageStylePreset> = {
    // --- Legacy / Active UI Styles ---
    "comic": {
        name: "Comic Book",
        description: "Bold comic-book style, thick outlines",
        prefix: "Western comic-book illustration, bold outlines, graphic dramatic style,",
        suffix: "halftone shading, vivid flat colors, dynamic heroic composition"
    },
    "creepy-comic": {
        name: "Creepy Comic",
        description: "Horror-comic style, exaggerated shades",
        prefix: "horror comic book illustration, dark and gritty, bold graphic lines,",
        suffix: "deep shadows, muted dark colors, eerie atmosphere, halftone textures"
    },
    "painting": {
        name: "Painting",
        description: "Detailed traditional painting style",
        prefix: "masterpiece, best quality, amazing quality, highly detailed digital illustration, rich textures",
        suffix: ""
    },
    "ghibli": {
        name: "Ghibli",
        description: "Studio Ghibli-inspired, soft colors",
        prefix: "whimsical hand-painted fantasy aesthetic with gentle storytelling atmosphere,",
        suffix: "soft painterly lighting, warm palettes, lush environmental detail"
    },
    "anime": {
        name: "Anime",
        description: "Clean anime style, sharp linework",
        prefix: "anime artwork",
        suffix: "anime style, key visual, vibrant, studio anime, highly detailed"
    },
    "dark-fantasy": {
        name: "Dark Fantasy",
        description: "Moody atmosphere, dark colors",
        prefix: "dark high-fantasy digital painting, brooding atmosphere, dramatic shadows,",
        suffix: "epic scale, mystical lighting, richly rendered environments"
    },
    "lego": {
        name: "Lego",
        description: "Plastic texture, LEGO figure style",
        prefix: "macro photography of a lego set, plastic toy bricks, miniature world,",
        suffix: "tilt-shift effect, bright colors, highly detailed plastic texture, octane render"
    },
    "polaroid": {
        name: "Polaroid",
        description: "Vintage Polaroid style, soft glow",
        prefix: "vintage polaroid photograph, flash photography, soft focus, retro aesthetic,",
        suffix: "white border (optional), faded colors, nostalgic vibe, chemical film texture"
    },
    "disney": {
        name: "Disney",
        description: "Classic animation style, soft curves",
        prefix: "classic animated movie style, hand-drawn cel animation look, vibrant colors,",
        suffix: "expressive characters, magical atmosphere, smooth lines, high production value"
    },
    "realism": {
        name: "Realism",
        description: "Ultra-realistic photographic style",
        prefix: "A cinematic photograph, natural lighting",
        suffix: "high contrast, professional photo, sharp focus"
    },
    "fantastic": {
        name: "Fantastic",
        description: "Vibrant magical fantasy style",
        prefix: "ethereal fantasy concept art of",
        suffix: "magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy"
    },

    // --- Buffer Styles (Future UI) ---
    "photo": {
        name: "Photo",
        description: "Standard cinematic photography",
        prefix: "A cinematic photograph, natural lighting",
        suffix: "high contrast, professional photo, sharp focus"
    },
    "medium-format": {
        name: "Medium Format",
        description: "High-end film photography look",
        prefix: "medium-format film photograph, movie-still aesthetic",
        suffix: "cinematic lighting and rim lighting, soft film grain, shallow depth of field, soft film grain and Kodak Portra tones."
    },
    "analog-photo": {
        name: "Analog Photo",
        description: "Vintage film aesthetic with imperfections",
        prefix: "analogue film photograph, grainy texture, soft contrast, warm tonal shifts,slight vignette, subtle chromatic aberration, shallow depth of field, vintage color palette,natural imperfections",
        suffix: "captured on vintage film stock, gentle film grain, organic light falloff,faded highlights, muted shadows"
    },
    "digital-art": {
        name: "Digital Art",
        description: "High quality digital illustration",
        prefix: "masterpiece, best quality, amazing quality, highly detailed digital illustration, rich textures",
        suffix: ""
    },
    "digital-art-vibrant": {
        name: "Digital Art Vibrant",
        description: "Vibrant and cinematic digital art",
        prefix: "a highly detailed digital artwork, vibrant color grading, smooth shading, high contrast, cinematic contrast, semi-illustrated, semi-realistic",
        suffix: ""
    },
    "digital-illustration": {
        name: "Digital Illustration",
        description: "Standard digital illustration",
        prefix: "Digital Illustration",
        suffix: ""
    },
    "greg-rutkowski-like": {
        name: "Greg Rutkowski Like",
        description: "High-fantasy oil painting style",
        prefix: "high-fantasy digital painting with dramatic lighting and richly rendered detail,",
        suffix: "epic composition, intricate highlights, atmospheric depth"
    },
    "dark-painterly-portrait": {
        name: "Dark Painterly Portrait",
        description: "Moody classical portrait style",
        prefix: "moody painterly portrait style, dramatic chiaroscuro lighting, soft shadows,legant classical atmosphere,fine-art photography look, softly blended tones, cinematic depth",
        suffix: "atmospheric vignette, soft falloff into darkness, highly sculpted light on the face, rich tonal contrast, refined fine-art mood"
    },
    "horror": {
        name: "Horror",
        description: "Gothic horror atmosphere",
        prefix: "gothic horror, dramatic chiaroscuro lighting",
        suffix: "heavy shadows, oppressive atmosphere, dark cinematic tone"
    },
    "1800s-photo": {
        name: "1800s Photo",
        description: "Antique daguerreotype style",
        prefix: "1800s photographic plate",
        suffix: "sepia daguerreotype style, aged texture, damaged film, antique photographic imperfections"
    },
    "gothic": {
        name: "Gothic",
        description: "Moody gothic atmosphere",
        prefix: "moody gothic atmosphere, muted desaturated colors, soft dramatic lighting, antique textures, somber yet readable tones,",
        suffix: "subtle shadows, aged stone and weathered surfaces, baroque gloom, atmospheric depth without heavy darkness"
    },
    "ansel-adams-landscape": {
        name: "Ansel Adams Landscape",
        description: "High-contrast B&W landscape photography",
        prefix: "high-contrast large-format black and white photography, dramatic tonal range, crisp micro-detail, deep shadows and bright highlights, rich texture, grand sweeping landscapes, monumental natural scenery, atmospheric depth",
        suffix: "zone-system inspired exposure, classic fine-art wilderness photography, sharp foreground detail, expansive skies, majestic natural composition, high clarity, timeless monochrome aesthetic, fine-grain realism"
    },
    "ansel-adams-portrait": {
        name: "Ansel Adams Portrait",
        description: "High-contrast B&W portrait photography",
        prefix: "high-contrast black and white fine-art portrait photography, deep rich tonal range, precise zone-system exposure, crisp micro-detail, soft diffused key lighting, classic medium-format look, sculpted highlights and deep shadows, clean minimalist backdrop,",
        suffix: "timeless fine-art realism, carefully controlled light and form, natural expression, strong textural definition, dramatic chiaroscuro, pure monochrome aesthetic, refined tonal control, gallery-quality portraiture"
    },
    "manga": {
        name: "Manga",
        description: "Black and white manga style",
        prefix: "black-and-white manga illustration, strong inking, dramatic panel-style contrast,",
        suffix: "screen-tone shading, stylized expressions, dynamic motion lines"
    },
    "90s-anime-ova": {
        name: "90s Anime OVA",
        description: "Retro 90s anime aesthetic",
        prefix: "1990s OVA anime aesthetic, sharp cel outlines, retro color palette,",
        suffix: "grainy film texture, dramatic highlights, nostalgic shading style"
    },
    "2000s-cel-digital-hybrid": {
        name: "2000s Cel Digital Hybrid",
        description: "Early 2000s anime style",
        prefix: "early-2000s anime hybrid cel/digital look, bright saturated colors,",
        suffix: "clean digital gradients, crisp character silhouettes"
    },
    "retro-vhs-anime": {
        name: "Retro VHS Anime",
        description: "Anime with VHS tape artifacts",
        prefix: "retro VHS anime aesthetic, soft analog blur, muted colors,",
        suffix: "chromatic bleeding, scanlines, tape noise artifacts"
    },
    "pixel-art": {
        name: "Pixel Art",
        description: "Retro pixel art style",
        prefix: "retro pixel art illustration, crisp pixel grid,",
        suffix: "limited palette, 8-bit/16-bit aesthetic, nostalgic game style"
    },
    "blanchitsu-like": {
        name: "Blanchitsu Like",
        description: "Grimdark Warhammer aesthetic",
        prefix: "digital illustration, red yellow rust palette, apocalyptic Warhammer chaos aesthetic, scorched orange skies, baroque gothic ornamentation, sketchy chaotic brushwork, dirty parchment tones mixed with blood-red and rust,  skulls and relics, ornate armor, insanity and zealotry, fever-dream battlefield energy, painterly grit and entropy,",
        suffix: "grimdark illustration, medieval religious iconography, chaotic composition, textured traditional media feel, ink-smudged edges, heavy contrast, stained parchment ambiance, raw painterly strokes, brutal gothic fantasy mood, IN THE GRIM DARKNESS OF THE FAR FUTURE THERE IS ONLY WAR"
    },
    "dark-moebius-like": {
        name: "Dark Moebius Like",
        description: "Surreal graphic sci-fi",
        prefix: "graphic surrealist fantasy with stark linework and eerie dreamlike architecture,",
        suffix: "limited palette, angular compositions, uncanny atmospheric tension"
    },
    "ghibli-like": {
        name: "Ghibli Like",
        description: "Whimsical hand-painted fantasy",
        prefix: "whimsical hand-painted fantasy aesthetic with gentle storytelling atmosphere,",
        suffix: "soft painterly lighting, warm palettes, lush environmental detail"
    },
    "loish-like": {
        name: "Loish Like",
        description: "Smooth stylized character art",
        prefix: "smooth stylized character illustration with soft feminine shapes and warm expressive palettes,",
        suffix: "painterly shading, gentle gradients, emotive storytelling focus"
    },
    "syd-mead-like": {
        name: "Syd Mead Like",
        description: "Retro-futurist industrial design",
        prefix: "sleek retro-futurist industrial design illustration, clean functional geometry,",
        suffix: "polished surfaces, advanced tech motifs, cinematic sci-fi scale"
    },
    "dark-fantasy-painterly": {
        name: "Dark Fantasy Painterly",
        description: "Brooding high-fantasy painting",
        prefix: "dark high-fantasy digital painting, brooding atmosphere, dramatic shadows,",
        suffix: "epic scale, mystical lighting, richly rendered environments"
    },
    "epic-concept-art": {
        name: "Epic Concept Art",
        description: "Cinematic AAA concept art",
        prefix: "cinematic AAA concept art style, sweeping vistas, detailed structures,",
        suffix: "heroic composition, atmospheric depth, ultra-polished rendering"
    },
    "scifi-hard-surface": {
        name: "SciFi Hard Surface",
        description: "Sleek industrial sci-fi",
        prefix: "sleek hard-surface sci-fi illustration, advanced materials,",
        suffix: "polished metallic detailing, industrial futuristic design"
    },
    "painterly-steampunk": {
        name: "Painterly Steampunk",
        description: "Victorian industrial fantasy",
        prefix: "steampunk fantasy painting, brass machinery, Victorian industrial mood,",
        suffix: "cogs, rivets, warm antique metal tones"
    },
    "cyberpunk": {
        name: "Cyberpunk",
        description: "Neon-drenched high-tech future",
        prefix: "neon-drenched cyberpunk future, dense holograms, rain-soaked streets, sleek urban tech,",
        suffix: "glowing circuitry, reflective surfaces, high-tech grit, electric atmosphere"
    },
    "solarpunk": {
        name: "Solarpunk",
        description: "Bright eco-futuristic utopia",
        prefix: "bright solarpunk utopia, organic architecture, lush greenery integrated with technology,",
        suffix: "sunlit renewable energy systems, harmonious eco-design, soft optimistic tones"
    },
    "dieselpunk": {
        name: "Dieselpunk",
        description: "Gritty 1940s industrial style",
        prefix: "dieselpunk retro-industrial world, heavy machinery, 1930s–40s engineered aesthetics,",
        suffix: "gritty oil-stained textures, brass fittings, smoky atmospheric haze"
    },
    "atompunk": {
        name: "Atompunk",
        description: "Retro-futuristic 1950s optimism",
        prefix: "retro-futuristic atompunk aesthetic, mid-century modern sci-fi optimism, chrome curves,",
        suffix: "atomic-age motifs, bright vintage colors, clean streamlined technology"
    },
    "steampunk": {
        name: "Steampunk",
        description: "Brass and copper mechanical style",
        prefix: "steampunk style ",
        suffix: "antique, mechanical, brass and copper tones, gears, intricate, detailed"
    },
    "post-apocalyptic": {
        name: "Post Apocalyptic",
        description: "Ruined wasteland aesthetic",
        prefix: "post-apocalyptic wasteland aesthetic, ruined structures, scavenged gear, desolate landscapes,",
        suffix: "dusty muted colors, broken machinery, survival-worn textures, bleak atmospheric haze"
    },
    "grunge": {
        name: "Grunge",
        description: "Dirty textured urban decay",
        prefix: "grunge aesthetic, dirty textured surfaces, raw distressed materials,",
        suffix: "oversaturated shadows, gritty urban decay, rough handmade visual noise"
    },
    "retro-space-opera": {
        name: "Retro Space Opera",
        description: "Vibrant pulp sci-fi",
        prefix: "retro space-opera aesthetic, vibrant pulp sci-fi colors,",
        suffix: "heroic cosmic scenes, vintage futurism"
    },
    "baroque": {
        name: "Baroque",
        description: "Dramatic ornate painting",
        prefix: "dramatic baroque painting style, deep contrast, rich ornamental detail,",
        suffix: "intense chiaroscuro lighting, grand expressive composition"
    },
    "grim-baroque-engraving": {
        name: "Grim Baroque Engraving",
        description: "Dark detailed line art",
        prefix: "grimdark gothic fantasy aesthetic, scratchy ink textures, baroque cluttered details, medieval surrealism,",
        suffix: "bleak palette, chaotic linework, decayed ornate motifs, brutal fantastical symbolism, antique occult atmosphere"
    },
    "victorian-storybook": {
        name: "Victorian Storybook",
        description: "Whimsical ink and watercolor",
        prefix: "whimsical fantasy sketch, style with loose expressive ink linework, soft sketchy contours, elongated and exaggerated character proportions, gentle watercolor washes in muted blues and earth tones, pale yellows, smoky grays, stained parchment background texture, playful yet slightly eerie atmosphere, ornate swirling costume details, lightly shaded forms with airy translucent layers,",
        suffix: "hand-drawn ink-and-watercolor aesthetic, textured paper grain, subtle ink bleed and splatter, warm antiqued color palette, soft gradients and uneven washes, lively expressive characters, dreamy storybook fantasy mood, traditional illustration finish."
    },
    "renaissance": {
        name: "Renaissance",
        description: "Classical balanced painting",
        prefix: "renaissance classical painting style, balanced composition, naturalistic anatomy,",
        suffix: "soft sfumato shading, muted warm tones, detailed drapery"
    },
    "rococo": {
        name: "Rococo",
        description: "Light ornate pastel style",
        prefix: "light and ornate rococo painting style, pastel elegance, decorative curls,",
        suffix: "playful romantic atmosphere, intricate ornamentation"
    },
    "symbolist": {
        name: "Symbolist",
        description: "Dreamlike poetic abstraction",
        prefix: "symbolist painting aesthetic, dreamlike imagery, poetic abstraction,",
        suffix: "mystical motifs, rich evocative color symbolism"
    },
    "fauvist": {
        name: "Fauvist",
        description: "Bold non-natural colors",
        prefix: "bold fauvist painting, expressive wild brushstrokes, intense non-natural colors,",
        suffix: "vivid contrast, emotional chromatic energy"
    },
    "cubist": {
        name: "Cubist",
        description: "Geometric fragmented abstraction",
        prefix: "geometric cubist abstraction, fragmented perspectives,",
        suffix: "angular shapes, layered overlapping planes, muted analytical palette"
    },
    "1950s": {
        name: "1950s TV",
        description: "Black and white broadcast look",
        prefix: "1950s aesthetic, black-and-white broadcast look, bright three-point stage lighting,",
        suffix: "flat theatrical studio sets, low contrast, soft analog tube-camera grain, classic TV framing"
    },
    "1960s": {
        name: "1960s TV",
        description: "Warm early color TV",
        prefix: "1960s aesthetic, warm early color television look, theatrical multi-cam lighting,",
        suffix: "saturated painted sets, mild analog softness, simplified mid-century décor"
    },
    "1970s": {
        name: "1970s TV",
        description: "Film-to-tape broadcast look",
        prefix: "1970s aesthetic, film-to-tape broadcast look, warm earthy tones, practical lighting,",
        suffix: "wood paneling, orange-brown retro palette, analog grain, wide studio framing"
    },
    "1980s": {
        name: "1980s TV",
        description: "Bright crisp video look",
        prefix: "1980s aesthetic, bright multi-camera studio look, crisp tube-camera highlights,",
        suffix: "bold pastel set colors, fluorescent lighting, VHS-level softness, laugh-track framing"
    },
    "1990s": {
        name: "1990s TV",
        description: "Polished broadcast look",
        prefix: "1990s aesthetic, polished network multi-cam production, clean broadcast color science,",
        suffix: "apartment and suburban sets, soft edge lighting, light analog grain"
    },
    "british-sitcom": {
        name: "British Sitcom",
        description: "70s muted studio style",
        prefix: "1970s British sitcom aesthetic, low-budget studio lighting, muted color palette,",
        suffix: "basic practical sets, soft analog video texture, theatrical staging"
    },
    "sai-3d-model": {
        name: "3D Model",
        description: "Octane render 3D style",
        prefix: "professional 3d model.",
        suffix: "octane render, highly detailed, volumetric, dramatic lighting"
    },
    "lovecraftian": {
        name: "Lovecraftian",
        description: "Cosmic horror",
        prefix: "lovecraftian horror",
        suffix: "eldritch, cosmic horror, unknown, mysterious, surreal, highly detailed"
    },
    "cinematic": {
        name: "Cinematic",
        description: "High budget film still",
        prefix: "cinematic film still",
        suffix: "shallow depth of field, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy"
    },
    "ethereal-fantasy": {
        name: "Ethereal Fantasy",
        description: "Dreamy celestial fantasy",
        prefix: "ethereal fantasy concept art of",
        suffix: "magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy"
    },
    "neonpunk": {
        name: "Neonpunk",
        description: "Vibrant neon cyberpunk",
        prefix: "neonpunk style",
        suffix: "cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional"
    },
    "abstract": {
        name: "Abstract",
        description: "Non-representational art",
        prefix: "abstract style",
        suffix: "non-representational, colors and shapes, expression of feelings, imaginative, highly detailed"
    },
    "art-deco": {
        name: "Art Deco",
        description: "Geometric luxury style",
        prefix: "art deco style",
        suffix: "geometric shapes, bold colors, luxurious, elegant, decorative, symmetrical, ornate, detailed"
    },
    "watercolor": {
        name: "Watercolor",
        description: "Vibrant watercolor painting",
        prefix: "watercolor painting",
        suffix: "vibrant, beautiful, painterly, detailed, textural, artistic"
    },
    "futuristic-sci-fi": {
        name: "Futuristic Sci-Fi",
        description: "Advanced technological style",
        prefix: "sci-fi style",
        suffix: "futuristic, technological, alien worlds, space themes, advanced civilizations"
    },
    "futuristic-vaporwave": {
        name: "Futuristic Vaporwave",
        description: "Retro 80s/90s neon style",
        prefix: "vaporwave style",
        suffix: "retro aesthetic, cyberpunk, vibrant, neon colors, vintage 80s and 90s style, highly detailed"
    },
    "cyberpunk-game": {
        name: "Cyberpunk Game",
        description: "Video game cyberpunk style",
        prefix: "cyberpunk game style",
        suffix: "neon, dystopian, futuristic, digital, vibrant, detailed, high contrast, reminiscent of cyberpunk genre video games"
    },
    "fighting-game": {
        name: "Fighting Game",
        description: "Dynamic action game style",
        prefix: "fighting game style",
        suffix: "dynamic, vibrant, action-packed, detailed character design, reminiscent of fighting video games"
    },
    "rpg-fantasy-game": {
        name: "RPG Fantasy Game",
        description: "Immersive RPG style",
        prefix: "role-playing game (RPG) style fantasy",
        suffix: "detailed, vibrant, immersive, reminiscent of high fantasy RPG games"
    },
    "dystopian": {
        name: "Dystopian",
        description: "Bleak post-apocalyptic style",
        prefix: "dystopian style",
        suffix: "bleak, post-apocalyptic, somber, dramatic, highly detailed"
    },
    "stained-glass": {
        name: "Stained Glass",
        description: "Translucent colored glass",
        prefix: "stained glass style",
        suffix: "vibrant, beautiful, translucent, intricate, detailed"
    },
    "stacked-papercut": {
        name: "Stacked Papercut",
        description: "Layered 3D paper art",
        prefix: "stacked papercut art of",
        suffix: "3D, layered, dimensional, depth, precision cut, stacked layers, papercut, high contrast"
    },
    "film-noir": {
        name: "Film Noir",
        description: "Classic high contrast BW",
        prefix: "film noir style",
        suffix: "monochrome, high contrast, dramatic shadows, 1940s style, mysterious, cinematic"
    },
    "long-exposure": {
        name: "Long Exposure",
        description: "Blurred motion photography",
        prefix: "long exposure photo of",
        suffix: "Blurred motion, streaks of light, surreal, dreamy, ghosting effect, highly detailed"
    },
    "neon-noir": {
        name: "Neon Noir",
        description: "Dark rainy neon style",
        prefix: "neon noir",
        suffix: "cyberpunk, dark, rainy streets, neon signs, high contrast, low light, vibrant, highly detailed"
    },
    "tilt-shift": {
        name: "Tilt Shift",
        description: "Miniature effect photography",
        prefix: "tilt-shift photo of",
        suffix: "selective focus, miniature effect, blurred background, highly detailed, vibrant, perspective control"
    },
    "nebula-witchcraft": {
        name: "Nebula Witchcraft",
        description: "Cosmic magic aesthetic",
        prefix: "cosmic witchcraft infused with nebula dust, swirling astral vapors, stellar incantations,",
        suffix: "starfire glow, spectral spell trails, vast magical deep-space haze"
    }
};

/**
 * Applies a style preset to a base prompt.
 * Injects the prompt between the style's prefix and suffix: {prefix}\n{base}\n{suffix}
 * 
 * @param prompt The base prompt
 * @param styleName The key/id of the style to apply (e.g. "comic", "medium-format")
 * @returns The styled prompt
 */
export function applyStyle(prompt: string, styleName?: string): string {
    if (!styleName || !prompt) {
        return prompt || "";
    }

    // Direct lookup (assuming styleName is already the ID, e.g. "comic")
    const preset = IMAGE_STYLE_PRESETS[styleName];

    if (preset) {
        // {prefix}\n{base}\n{suffix}
        const parts = [preset.prefix, prompt, preset.suffix].filter(p => p && p.trim().length > 0);
        return parts.join("\n");
    }

    // Fallback: If styleName is not in the list, just return original prompt
    return prompt;
}
