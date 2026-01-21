
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
            "video_id" text,
            "series_id" text,
            "created_at" integer
        );
    `);
}
