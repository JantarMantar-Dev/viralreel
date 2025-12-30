
import { renderJob } from '../db/schema.js';

export interface Processor {
    name: string;
    /**
     * Attempts to find and lock a job for this processor.
     * Should return the Locked Job if found, null otherwise.
     * This runs inside a transaction typically, or manages its own locking.
     */
    findAndLockJob(): Promise<typeof renderJob.$inferSelect | null>;

    /**
     * Processes the given job.
     */
    process(job: typeof renderJob.$inferSelect): Promise<void>;
}
