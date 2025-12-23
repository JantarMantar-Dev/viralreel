import { pgTable, text, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

// --- Content Configuration Models ---

/**
 * ContentNiche
 * Defines a specific content category or style niche (e.g., "Motivational", "Tech Facts").
 * Contains explicit prompts for script and video generation to ensure consistency.
 */
export const contentNiche = pgTable("content_niche", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull().unique(), // Unique identifier name for the niche
    description: text("description"), // Human-readable description
    iconUrl: text("icon_url"), // URL to an icon representing this niche
    iconName: text("icon_name"), // Lucide icon name for frontend mapping
    tags: text("tags"), // Comma-separated tags for the niche
    userId: text("user_id").default("admin"), // ID of the user who created this niche, or 'admin' for defaults

    // Prompts
    scriptPrompt: text("script_prompt"), // System prompt used for script generation
    videoPrompt: text("video_prompt"), // System prompt used for video visual descriptions

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * ImageStyle
 * Defines the visual style for AI image generation (e.g., "Neon Punk", "Minimalist").
 */
export const imageStyle = pgTable("image_style", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull().unique(), // Display name of the style
    description: text("description"), // Description of the visual style
    promptModifier: text("prompt_modifier"), // String appended to image generation prompts
    isActive: boolean("is_active").default(true), // Soft delete/enable flag

    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * SubtitleStyle
 * Configuration for subtitle overlay appearance (font, size, colors).
 */
export const subtitleStyle = pgTable("subtitle_style", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull().unique(), // Display name of the style

    fontName: text("font_name"), // Font family name
    fontSize: integer("font_size"), // Font size in pixels
    fontColor: text("font_color").default("#FFFFFF"), // Hex color code
    strokeColor: text("stroke_color").default("#000000"), // Hex stroke/outline color
    backgroundColor: text("background_color"), // Optional background box color

    defaultWordsPerLine: integer("default_words_per_line").default(1), // Target words per subtitle segment

    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * MusicTrack
 * Catalog of background music tracks available for videos.
 */
export const musicTrack = pgTable("music_track", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(), // Track title
    url: text("url").notNull(), // URL to the audio file
    durationSeconds: integer("duration_seconds"), // Length of track
    userId: text("user_id").default("admin"), // ID of the user who created this track, or 'admin' for defaults

    isActive: boolean("is_active").default(true), // Soft delete/enable flag
    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * TTSVoice
 * Configuration for Text-to-Speech voices from various providers.
 */
export const ttsVoice = pgTable("tts_voice", {
    id: text("id").primaryKey(), // UUID
    provider: text("provider").notNull(), // Enum: 'ELEVENLABS', 'OPENAI', etc.
    providerVoiceId: text("provider_voice_id").notNull(), // ID used by the provider API

    name: text("name").notNull(), // Display name
    gender: text("gender"), // 'MALE', 'FEMALE', etc.
    languageCode: text("language_code").default("en"), // ISO language code
    previewUrl: text("preview_url"), // URL to a voice sample

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

// --- Core Video Models ---

/**
 * VideoGroup
 * Represents a collection of videos, either a single video project or a series.
 */
export const videoGroup = pgTable("video_group", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id), // Owner
    nicheId: text("niche_id").references(() => contentNiche.id), // Configured niche

    name: text("name").notNull(), // Project title
    description: text("description"), // Project description
    groupType: text("group_type").notNull(), // Enum: 'SINGLE' or 'SERIES'

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * VideoItem
 * An individual video episode or unit within a group.
 */
export const videoItem = pgTable("video_item", {
    id: text("id").primaryKey(), // UUID
    groupId: text("group_id").notNull().references(() => videoGroup.id), // Parent group
    nicheId: text("niche_id").references(() => contentNiche.id), // Override niche (optional)

    episodeNumber: integer("episode_number").default(1), // Sequencing
    title: text("title").notNull(), // Episode title

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * VideoItemMetadata
 * Detailed configuration and generated parameters for a specific VideoItem.
 * Stores style selections, prompts, and output specifications.
 */
export const videoItemMetadata = pgTable("video_item_metadata", {
    id: text("id").primaryKey(), // UUID
    itemId: text("item_id").notNull().unique().references(() => videoItem.id), // One-to-one with VideoItem

    // Style Links
    imageStyleId: text("image_style_id").references(() => imageStyle.id),
    subtitleStyleId: text("subtitle_style_id").references(() => subtitleStyle.id),
    backgroundMusicId: text("background_music_id").references(() => musicTrack.id),
    voiceId: text("voice_id").references(() => ttsVoice.id),

    // Content Content
    masterPrompt: text("master_prompt"), // The core idea user provided
    scriptPayload: json("script_payload"), // The generated script structure

    // Tech Specs
    platform: text("platform"), // Enum: 'YOUTUBE', 'TIKTOK', etc.
    aspectRatio: text("aspect_ratio").default("9:16"),
    durationCategory: text("duration_category"),

    // Pacing
    subtitleWordsPerLine: integer("subtitle_words_per_line"),

    // Output
    outputUrl: text("output_url"), // Final video URL

    // internal config
    extraParameters: json("extra_parameters"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * VideoJob
 * Tracks the async processing state of video generation.
 */
export const videoJob = pgTable("video_job", {
    id: text("id").primaryKey(), // UUID
    itemId: text("item_id").references(() => videoItem.id), // Target video
    userId: text("user_id").notNull(), // Triggered by

    status: text("status").notNull(), // Enum: 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'
    priority: integer("priority").default(0),

    workerId: text("worker_id"), // ID of worker processing this
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    outputUrl: text("output_url"), // Redundant but convenient ref
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
