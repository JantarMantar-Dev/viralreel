
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: 'boolean' }).notNull(),
    image: text("image"),
    stripeCustomerId: text("stripe_customer_id").unique(),
    planTag: text("plan_tag").default("launch"),
    createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull(),
});

export const contentNiche = sqliteTable("content_niche", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    iconUrl: text("icon_url"),
    scriptPrompt: text("script_prompt"),
    videoPrompt: text("video_prompt"),
    tags: text("tags"),
    iconName: text("icon_name"),
    userId: text("user_id").default('admin'),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const series = sqliteTable("series", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    nicheId: text("niche_id").references(() => contentNiche.id),
    name: text("name").notNull(),
    description: text("description"),
    episodeCount: integer("episode_count").default(1),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const video = sqliteTable("video", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    seriesId: text("series_id").references(() => series.id),
    nicheId: text("niche_id").references(() => contentNiche.id),
    title: text("title").notNull(),
    description: text("description"),
    episodeNumber: integer("episode_number").default(1),
    status: text("status").default('DRAFT').notNull(),
    metadata: text("metadata", { mode: 'json' }), // SQLite stores JSON as text
    outputUrl: text("output_url"),
    thumbnailUrl: text("thumbnail_url"),
    compressedUrl: text("compressed_url"),
    mode: text("mode").default('auto').notNull(),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const renderJob = sqliteTable("render_job", {
    id: text("id").primaryKey(),
    videoId: text("video_id").notNull().references(() => video.id),
    status: text("status").default('QUEUED').notNull(),
    workerId: text("worker_id"),
    progress: integer("progress").default(0),
    error: text("error"),
    originalUrl: text("original_url"),
    compressedUrl: text("compressed_url"),
    retryCount: integer("retry_count").default(0),
    metadata: text("metadata", { mode: 'json' }),
    startedAt: integer("started_at", { mode: 'timestamp' }),
    completedAt: integer("completed_at", { mode: 'timestamp' }),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const script = sqliteTable("script", {
    id: text("id").primaryKey(),
    videoId: text("video_id").notNull().references(() => video.id),
    content: text("content", { mode: 'json' }),
    rawText: text("raw_text"),
    isApproved: integer("is_approved", { mode: 'boolean' }).default(false),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const creditBalance = sqliteTable("credit_balance", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id).unique(),
    amountTotal: integer("amount_total").notNull(),
    amountUsed: integer("amount_used").default(0).notNull(),
    expiresAt: integer("expires_at", { mode: 'timestamp' }),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(new Date()),
});

export const creditTransaction = sqliteTable("credit_transaction", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    creditBalanceId: text("credit_balance_id").references(() => creditBalance.id),
    amount: integer("amount").notNull(),
    description: text("description"),
    comment: text("comment"),
    videoId: text("video_id").references(() => video.id),
    seriesId: text("series_id").references(() => series.id),
    createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
});
