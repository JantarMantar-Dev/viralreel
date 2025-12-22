CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_niche" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"script_prompt" text,
	"video_prompt" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "content_niche_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "image_style" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"prompt_modifier" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "image_style_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "music_track" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"mood" text,
	"duration_seconds" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subtitle_style" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"font_name" text,
	"font_size" integer,
	"font_color" text DEFAULT '#FFFFFF',
	"stroke_color" text DEFAULT '#000000',
	"background_color" text,
	"default_words_per_line" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subtitle_style_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tts_voice" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_voice_id" text NOT NULL,
	"name" text NOT NULL,
	"gender" text,
	"language_code" text DEFAULT 'en',
	"preview_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "video_group" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"niche_id" text,
	"name" text NOT NULL,
	"description" text,
	"group_type" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_item" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"niche_id" text,
	"episode_number" integer DEFAULT 1,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_item_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"image_style_id" text,
	"subtitle_style_id" text,
	"background_music_id" text,
	"voice_id" text,
	"master_prompt" text,
	"script_payload" json,
	"platform" text,
	"aspect_ratio" text DEFAULT '9:16',
	"duration_category" text,
	"subtitle_words_per_line" integer,
	"output_url" text,
	"extra_parameters" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "video_item_metadata_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "video_job" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"priority" integer DEFAULT 0,
	"worker_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"output_url" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_group" ADD CONSTRAINT "video_group_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_group" ADD CONSTRAINT "video_group_niche_id_content_niche_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."content_niche"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item" ADD CONSTRAINT "video_item_group_id_video_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."video_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item" ADD CONSTRAINT "video_item_niche_id_content_niche_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."content_niche"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item_metadata" ADD CONSTRAINT "video_item_metadata_item_id_video_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."video_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item_metadata" ADD CONSTRAINT "video_item_metadata_image_style_id_image_style_id_fk" FOREIGN KEY ("image_style_id") REFERENCES "public"."image_style"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item_metadata" ADD CONSTRAINT "video_item_metadata_subtitle_style_id_subtitle_style_id_fk" FOREIGN KEY ("subtitle_style_id") REFERENCES "public"."subtitle_style"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item_metadata" ADD CONSTRAINT "video_item_metadata_background_music_id_music_track_id_fk" FOREIGN KEY ("background_music_id") REFERENCES "public"."music_track"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_item_metadata" ADD CONSTRAINT "video_item_metadata_voice_id_tts_voice_id_fk" FOREIGN KEY ("voice_id") REFERENCES "public"."tts_voice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_job" ADD CONSTRAINT "video_job_item_id_video_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."video_item"("id") ON DELETE no action ON UPDATE no action;