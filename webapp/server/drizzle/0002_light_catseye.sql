ALTER TABLE "content_niche" ADD COLUMN IF NOT EXISTS "icon_name" text;--> statement-breakpoint
ALTER TABLE "content_niche" ADD COLUMN IF NOT EXISTS "user_id" text DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "music_track" ADD COLUMN IF NOT EXISTS "user_id" text DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "music_track" DROP COLUMN IF EXISTS "mood";