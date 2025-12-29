ALTER TABLE "subscription_plan" ADD COLUMN "tag" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_tag" text DEFAULT 'launch';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_tag_expires_at" timestamp DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 months';