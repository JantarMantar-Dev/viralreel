import fs from "fs";
import path from "path";
import crypto from "crypto";
import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";

dotenv.config();

const migrationFile = "0000_puzzling_mole_man.sql";
const migrationPath = path.join(process.cwd(), "drizzle", migrationFile);

async function baseline() {
    console.log("🚀 Baseling migration: " + migrationFile);

    if (!fs.existsSync(migrationPath)) {
        console.error("❌ Migration file not found at " + migrationPath);
        process.exit(1);
    }

    const content = fs.readFileSync(migrationPath, "utf8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        // Create drizzle schema and migrations table if they don't exist
        await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle";`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
                id SERIAL PRIMARY KEY,
                hash text NOT NULL,
                created_at bigint
            );
        `);

        // Check if already baselined
        const res = await client.query(`SELECT * FROM "drizzle"."__drizzle_migrations" WHERE hash = $1`, [hash]);
        if (res.rows.length > 0) {
            console.log("✅ Migration is already recorded in history.");
        } else {
            // Insert the migration record
            // The ID is usually the index from the journal
            await client.query(
                `INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
                [hash, Date.now()]
            );
            console.log("✅ Successfully baselined " + migrationFile);
        }
    } catch (error) {
        console.error("❌ Baselining failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

baseline();
