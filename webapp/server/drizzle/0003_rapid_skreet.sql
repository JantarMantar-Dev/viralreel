ALTER TABLE "subtitle_style" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "subtitle_style" ADD COLUMN "preview_text" text;--> statement-breakpoint
ALTER TABLE "subtitle_style" ADD COLUMN "css" text;--> statement-breakpoint
ALTER TABLE "subtitle_style" ADD COLUMN "is_active" boolean DEFAULT true;