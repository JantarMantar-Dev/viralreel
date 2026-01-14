import { pgTable, unique, text, boolean, timestamp, foreignKey, integer, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const imageStyle = pgTable("image_style", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	promptModifier: text("prompt_modifier"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("image_style_name_unique").on(table.name),
]);

export const ttsVoice = pgTable("tts_voice", {
	id: text().primaryKey().notNull(),
	provider: text().notNull(),
	providerVoiceId: text("provider_voice_id").notNull(),
	name: text().notNull(),
	gender: text(),
	languageCode: text("language_code").default('en'),
	previewUrl: text("preview_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const musicTrack = pgTable("music_track", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	url: text().notNull(),
	durationSeconds: integer("duration_seconds"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	userId: text("user_id").default('admin'),
});

export const subtitleStyle = pgTable("subtitle_style", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	fontName: text("font_name"),
	fontSize: integer("font_size"),
	fontColor: text("font_color").default('#FFFFFF'),
	strokeColor: text("stroke_color").default('#000000'),
	backgroundColor: text("background_color"),
	defaultWordsPerLine: integer("default_words_per_line").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	description: text(),
	previewText: text("preview_text"),
	css: text(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("subtitle_style_name_unique").on(table.name),
]);

export const script = pgTable("script", {
	id: text().primaryKey().notNull(),
	videoId: text("video_id").notNull(),
	content: json(),
	rawText: text("raw_text"),
	isApproved: boolean("is_approved").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.videoId],
			foreignColumns: [video.id],
			name: "script_video_id_video_id_fk"
		}),
]);

export const contentNiche = pgTable("content_niche", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	iconUrl: text("icon_url"),
	scriptPrompt: text("script_prompt"),
	videoPrompt: text("video_prompt"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tags: text(),
	iconName: text("icon_name"),
	userId: text("user_id").default('admin'),
});

export const series = pgTable("series", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	nicheId: text("niche_id"),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	episodeCount: integer("episode_count").default(1),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "series_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.nicheId],
			foreignColumns: [contentNiche.id],
			name: "series_niche_id_content_niche_id_fk"
		}),
]);

export const creditBalance = pgTable("credit_balance", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	amountTotal: integer("amount_total").notNull(),
	amountUsed: integer("amount_used").default(0).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "credit_balance_user_id_user_id_fk"
		}),
	unique("credit_balance_user_id_unique").on(table.userId),
]);

export const creditTransaction = pgTable("credit_transaction", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	creditBalanceId: text("credit_balance_id"),
	amount: integer().notNull(),
	videoId: text("video_id"),
	seriesId: text("series_id"),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "credit_transaction_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.creditBalanceId],
			foreignColumns: [creditBalance.id],
			name: "credit_transaction_credit_balance_id_credit_balance_id_fk"
		}),
	foreignKey({
			columns: [table.videoId],
			foreignColumns: [video.id],
			name: "credit_transaction_video_id_video_id_fk"
		}),
	foreignKey({
			columns: [table.seriesId],
			foreignColumns: [series.id],
			name: "credit_transaction_series_id_series_id_fk"
		}),
]);

export const paymentHistory = pgTable("payment_history", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	amount: integer().notNull(),
	currency: text().default('usd').notNull(),
	status: text().notNull(),
	stripePaymentId: text("stripe_payment_id"),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "payment_history_user_id_user_id_fk"
		}),
]);

export const userSubscription = pgTable("user_subscription", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	planId: text("plan_id").notNull(),
	stripeSubscriptionId: text("stripe_subscription_id"),
	status: text().notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isCurrent: boolean("is_current").default(true),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_subscription_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [subscriptionPlan.id],
			name: "user_subscription_plan_id_subscription_plan_id_fk"
		}),
	unique("user_subscription_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const renderJob = pgTable("render_job", {
	id: text().primaryKey().notNull(),
	videoId: text("video_id").notNull(),
	status: text().default('QUEUED').notNull(),
	workerId: text("worker_id"),
	progress: integer().default(0),
	error: text(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	originalUrl: text("original_url"),
	compressedUrl: text("compressed_url"),
	retryCount: integer("retry_count").default(0),
	metadata: json(),
}, (table) => [
	foreignKey({
			columns: [table.videoId],
			foreignColumns: [video.id],
			name: "render_job_video_id_video_id_fk"
		}),
]);

export const subscriptionPlan = pgTable("subscription_plan", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: integer().notNull(),
	currency: text().default('usd').notNull(),
	interval: text(),
	credits: integer().notNull(),
	stripePriceId: text("stripe_price_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tag: text(),
}, (table) => [
	unique("subscription_plan_stripe_price_id_unique").on(table.stripePriceId),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	planTag: text("plan_tag").default('launch'),
	planTagExpiresAt: timestamp("plan_tag_expires_at", { mode: 'string' }).default(sql`(CURRENT_TIMESTAMP + '2 mons'::interval)`),
}, (table) => [
	unique("user_email_unique").on(table.email),
	unique("user_stripe_customer_id_unique").on(table.stripeCustomerId),
]);

export const video = pgTable("video", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	seriesId: text("series_id"),
	nicheId: text("niche_id"),
	title: text().notNull(),
	description: text(),
	episodeNumber: integer("episode_number").default(1),
	status: text().default('DRAFT').notNull(),
	metadata: json(),
	outputUrl: text("output_url"),
	thumbnailUrl: text("thumbnail_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	compressedUrl: text("compressed_url"),
	mode: text().default('auto').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "video_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.seriesId],
			foreignColumns: [series.id],
			name: "video_series_id_series_id_fk"
		}),
	foreignKey({
			columns: [table.nicheId],
			foreignColumns: [contentNiche.id],
			name: "video_niche_id_content_niche_id_fk"
		}),
]);
