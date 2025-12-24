ALTER TABLE "subtitle_style" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "subtitle_style" ADD COLUMN IF NOT EXISTS "preview_text" text;--> statement-breakpoint
ALTER TABLE "subtitle_style" ADD COLUMN IF NOT EXISTS "css" text;--> statement-breakpoint
ALTER TABLE "subtitle_style" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;