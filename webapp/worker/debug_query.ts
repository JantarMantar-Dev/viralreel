
import { db } from './src/db/index.js';
import { renderJob } from './src/db/schema.js';
import { inArray, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function debugQuery() {
    console.log('Debugging polling query...');

    // Check what is in DB
    const allJobs = await db.select().from(renderJob);
    console.log('All Jobs Statuses:', allJobs.map(j => ({ id: j.id, status: j.status })));

    // Run the exact query
    const start = Date.now();
    try {
        const jobs = await db.select()
            .from(renderJob)
            .where(inArray(renderJob.status, ['SCRIPT_READY', 'AI_ASSET_GEN_QUEUED']))
            .limit(1);

        console.log('Query result:', jobs);

        // Check for locked items? (cannot easily simulate transaction lock check here without blocking)

    } catch (e) {
        console.error('Query failed:', e);
    }


    process.exit(0);
}

debugQuery().catch(console.error);
