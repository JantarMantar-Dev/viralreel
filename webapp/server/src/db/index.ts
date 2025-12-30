import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export const runMigrations = async () => {
    try {
        console.log("Running migrations...");
        const migrationsFolder = path.join(process.cwd(), "drizzle");
        await migrate(db, { migrationsFolder });
        console.log("Migrations completed successfully");
    } catch (error) {
        console.error("Error running migrations:", error);
        throw error;
    }
};
