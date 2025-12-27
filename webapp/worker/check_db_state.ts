
import { db } from './src/db/index.js';
import { renderJob } from './src/db/schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkJobs() {
    console.log('Checking RenderJob table...');
    const jobs = await db.select().from(renderJob);

    console.log(`Total jobs found: ${jobs.length}`);
    if (jobs.length > 0) {
        console.table(jobs.map(j => ({
            id: j.id,
            videoId: j.videoId,
            status: j.status,
            workerId: j.workerId,
            error: j.error ? j.error.substring(0, 50) : null
        })));
    } else {
        console.log('No jobs found.');
    }

    process.exit(0);
}

checkJobs().catch(console.error);
