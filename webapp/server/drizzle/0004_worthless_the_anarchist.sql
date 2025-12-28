CREATE TABLE IF NOT EXISTS "render_job" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"worker_id" text,
	"progress" integer DEFAULT 0,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "script" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"content" json,
	"raw_text" text,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "series" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"niche_id" text,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"series_id" text,
	"niche_id" text,
	"title" text NOT NULL,
	"description" text,
	"episode_number" integer DEFAULT 1,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"metadata" json,
	"output_url" text,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'render_job_video_id_video_id_fk') THEN
        ALTER TABLE "render_job" ADD CONSTRAINT "render_job_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'script_video_id_video_id_fk') THEN
        ALTER TABLE "script" ADD CONSTRAINT "script_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'series_user_id_user_id_fk') THEN
        ALTER TABLE "series" ADD CONSTRAINT "series_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'series_niche_id_content_niche_id_fk') THEN
        ALTER TABLE "series" ADD CONSTRAINT "series_niche_id_content_niche_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."content_niche"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_user_id_user_id_fk') THEN
        ALTER TABLE "video" ADD CONSTRAINT "video_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_series_id_series_id_fk') THEN
        ALTER TABLE "video" ADD CONSTRAINT "video_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_niche_id_content_niche_id_fk') THEN
        ALTER TABLE "video" ADD CONSTRAINT "video_niche_id_content_niche_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."content_niche"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;