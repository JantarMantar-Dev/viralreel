
import Database from 'better-sqlite3';

export function createTables(sqlite: Database.Database) {
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS "user" (
            "id" text PRIMARY KEY NOT NULL,
            "name" text NOT NULL,
            "email" text NOT NULL,
            "email_verified" integer NOT NULL,
            "image" text,
            "stripe_customer_id" text,
            "plan_tag" text DEFAULT 'launch',
            "created_at" integer NOT NULL,
            "updated_at" integer NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "user_email_unique" ON "user" ("email");
        CREATE UNIQUE INDEX IF NOT EXISTS "user_stripe_customer_id_unique" ON "user" ("stripe_customer_id");

        CREATE TABLE IF NOT EXISTS "content_niche" (
            "id" text PRIMARY KEY NOT NULL,
            "name" text NOT NULL,
            "description" text,
            "icon_url" text,
            "script_prompt" text,
            "video_prompt" text,
            "tags" text,
            "icon_name" text,
            "user_id" text DEFAULT 'admin',
            "created_at" integer,
            "updated_at" integer
        );

        CREATE TABLE IF NOT EXISTS "series" (
            "id" text PRIMARY KEY NOT NULL,
            "user_id" text NOT NULL REFERENCES "user"("id"),
            "niche_id" text REFERENCES "content_niche"("id"),
            "name" text NOT NULL,
            "description" text,
            "episode_count" integer DEFAULT 1,
            "created_at" integer,
            "updated_at" integer
        );

        CREATE TABLE IF NOT EXISTS "video" (
            "id" text PRIMARY KEY NOT NULL,
            "user_id" text NOT NULL REFERENCES "user"("id"),
            "series_id" text REFERENCES "series"("id"),
            "niche_id" text REFERENCES "content_niche"("id"),
            "title" text NOT NULL,
            "description" text,
            "episode_number" integer DEFAULT 1,
            "status" text DEFAULT 'DRAFT' NOT NULL,
            "metadata" text,
            "output_url" text,
            "thumbnail_url" text,
            "compressed_url" text,
            "mode" text DEFAULT 'auto' NOT NULL,
            "created_at" integer,
            "updated_at" integer
        );

        CREATE TABLE IF NOT EXISTS "render_job" (
            "id" text PRIMARY KEY NOT NULL,
            "video_id" text NOT NULL REFERENCES "video"("id"),
            "status" text DEFAULT 'QUEUED' NOT NULL,
            "worker_id" text,
            "progress" integer DEFAULT 0,
            "error" text,
            "original_url" text,
            "compressed_url" text,
            "retry_count" integer DEFAULT 0,
            "metadata" text,
            "started_at" integer,
            "completed_at" integer,
            "created_at" integer,
            "updated_at" integer
        );

        CREATE TABLE IF NOT EXISTS "script" (
            "id" text PRIMARY KEY NOT NULL,
            "video_id" text NOT NULL REFERENCES "video"("id"),
            "content" text,
            "raw_text" text,
            "is_approved" integer DEFAULT 0,
            "created_at" integer,
            "updated_at" integer
        );

        CREATE TABLE IF NOT EXISTS "credit_balance" (
            "id" text PRIMARY KEY NOT NULL,
            "user_id" text NOT NULL REFERENCES "user"("id"),
            "amount_total" integer NOT NULL,
            "amount_used" integer DEFAULT 0 NOT NULL,
            "expires_at" integer,
            "created_at" integer,
            "updated_at" integer
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "credit_balance_user_id_unique" ON "credit_balance" ("user_id");

        CREATE TABLE IF NOT EXISTS "credit_transaction" (
            "id" text PRIMARY KEY NOT NULL,
            "user_id" text NOT NULL REFERENCES "user"("id"),
            "credit_balance_id" text REFERENCES "credit_balance"("id"),
            "amount" integer NOT NULL,
            "description" text,
            "comment" text,
            "video_id" text REFERENCES "video"("id"),
            "series_id" text REFERENCES "series"("id"),
            "created_at" integer
        );
    `);
}
