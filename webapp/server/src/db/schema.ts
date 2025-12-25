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
    name: text("name").notNull(), // identifier name for the niche
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
    description: text("description"), // Description of the subtitle style
    previewText: text("preview_text"), // Text to display in the preview
    // CSS styles will be used for UI preview
    css: text("css"), // CSS styles for the subtitle
    isActive: boolean("is_active").default(true), // Soft delete/enable flag

    // These are the properties that will be used for subtitle generation
    // using video generation API
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

// --- Video Generation Models ---

/**
 * Series
 * Represents a collection of videos. Even a single video project can be a series of 1.
 */
export const series = pgTable("series", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id), // Owner
    nicheId: text("niche_id").references(() => contentNiche.id), // Default niche for the series

    name: text("name").notNull(), // Series Title
    description: text("description"),
    episodeCount: integer("episode_count").default(1),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Video
 * The primary unit of content. Can exist standalone (series_id=null or 1-video series)
 * or as part of a larger series.
 */
export const video = pgTable("video", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id),
    seriesId: text("series_id").references(() => series.id), // Optional parent series
    nicheId: text("niche_id").references(() => contentNiche.id), // Specific niche (overrides series)

    title: text("title").notNull(),
    description: text("description"),
    episodeNumber: integer("episode_number").default(1), // Order in series

    // Lifecycle Status
    status: text("status").notNull().default("DRAFT"), // DRAFT, SCRIPTING, SCRIPT_READY, GENERATING, COMPLETED, FAILED

    // Configuration / Metadata (Voice, Style, Music, etc.)
    metadata: json("metadata"),

    // Output
    outputUrl: text("output_url"), // Final S3 URL
    thumbnailUrl: text("thumbnail_url"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Script
 * The textual and visual blueprint for a video.
 * distinct from the video to allow for multiple iterations/drafts if needed.
 */
export const script = pgTable("script", {
    id: text("id").primaryKey(), // UUID
    videoId: text("video_id").notNull().references(() => video.id),

    content: json("content"), // Structured script (segments, dialogue, visual prompts)
    rawText: text("raw_text"), // Flat text representation if needed

    isApproved: boolean("is_approved").default(false), // User approval flag

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * RenderJob
 * Tracks the async GPU/Cloud generation process.
 */
export const renderJob = pgTable("render_job", {
    id: text("id").primaryKey(), // UUID
    videoId: text("video_id").notNull().references(() => video.id),

    status: text("status").notNull().default("QUEUED"), // QUEUED, PROCESSING, COMPLETED, FAILED
    workerId: text("worker_id"), // ID of the worker picking up the job

    progress: integer("progress").default(0), // 0-100
    error: text("error"), // Error message if failed

    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Payment & Credit System ---

/**
 * SubscriptionPlan
 * Defines available subscription tiers and credit packs.
 */
export const subscriptionPlan = pgTable("subscription_plan", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(), // e.g. "Pro Monthly", "Starter Pack"
    description: text("description"),
    price: integer("price").notNull(), // Price in cents
    currency: text("currency").default("usd").notNull(),
    interval: text("interval"), // 'month', 'year', or null for one-time
    credits: integer("credits").notNull(), // Number of credits granted
    stripePriceId: text("stripe_price_id").unique(), // Stripe Price ID
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * UserSubscription
 * Tracks the user's active recurring subscription.
 */
export const userSubscription = pgTable("user_subscription", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id),
    planId: text("plan_id").notNull().references(() => subscriptionPlan.id),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    status: text("status").notNull(), // active, canceled, past_due, trialing
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * PaymentHistory
 * Log of all charges (subscriptions and one-time purchases).
 */
export const paymentHistory = pgTable("payment_history", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id),
    amount: integer("amount").notNull(), // Amount in cents
    currency: text("currency").default("usd").notNull(),
    status: text("status").notNull(), // succeeded, failed, pending
    stripePaymentId: text("stripe_payment_id"), // PaymentIntent ID or Invoice ID
    metadata: json("metadata"), // Arbitrary metadata from Stripe
    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * CreditBalance (Credit Grants)
 * Tracks available credits separated by their source (Plan vs Top-up).
 * Allows users to know "credits against the plan".
 */
export const creditBalance = pgTable("credit_balance", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id),
    planId: text("plan_id").references(() => subscriptionPlan.id), // Nullable if manual grant
    amountTotal: integer("amount_total").notNull(), // Initial amount granted
    amountUsed: integer("amount_used").default(0).notNull(), // Amount consumed
    expiresAt: timestamp("expires_at"), // Nullable (e.g. monthly credits expire, packs don't)
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * CreditTransaction
 * Log of every credit usage, linked to specific content.
 */
export const creditTransaction = pgTable("credit_transaction", {
    id: text("id").primaryKey(), // UUID
    userId: text("user_id").notNull().references(() => user.id),
    creditBalanceId: text("credit_balance_id").references(() => creditBalance.id), // Which grant was used
    amount: integer("amount").notNull(), // Negative for usage, positive for refunds
    videoId: text("video_id").references(() => video.id), // Linked content
    seriesId: text("series_id").references(() => series.id), // Linked content
    description: text("description"), // Audit log description
    createdAt: timestamp("created_at").defaultNow(),
});
