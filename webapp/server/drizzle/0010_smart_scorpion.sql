ALTER TABLE "render_job" ADD COLUMN IF NOT EXISTS "original_url" text;--> statement-breakpoint
ALTER TABLE "render_job" ADD COLUMN IF NOT EXISTS "compressed_url" text;--> statement-breakpoint
ALTER TABLE "render_job" ADD COLUMN IF NOT EXISTS "retry_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "render_job" ADD COLUMN IF NOT EXISTS "metadata" json;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN IF NOT EXISTS "compressed_url" text;