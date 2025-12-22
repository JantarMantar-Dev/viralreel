import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1 // Only one connection for migration
});

const db = drizzle(pool);

async function runMigrations() {
    console.log("⏳ Running database migrations...");
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("✅ Migrations completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
