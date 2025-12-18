import asyncio
import logging
import signal
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import VideoJob, JobStatus
from pipeline import VideoPipeline

from logger import configure_logging

# Configure Logging
logger = configure_logging("worker")

class Worker:
    def __init__(self):
        self.running = True
        self.pipeline = None
        
    async def get_next_job(self, db: AsyncSession):
        # Determine next job: QUEUED, oldest created_at first
        # In production, use SELECT ... FOR UPDATE SKIP LOCKED
        result = await db.execute(
            select(VideoJob)
            .where(VideoJob.status == JobStatus.QUEUED)
            .order_by(VideoJob.created_at.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def run(self):
        logger.info("Worker started. Waiting for jobs...")
        
        while self.running:
            try:
                async with AsyncSessionLocal() as session:
                    # Initialize Pipeline (injected with session)
                    # In a real scenario, dependencies might be singleton or session-scoped
                    self.pipeline = VideoPipeline(db_session=session)
                    
                    job = await self.get_next_job(session)
                    
                    if job:
                        logger.info(f"Picked up job {job.id}")
                        await self.pipeline.process_job(job.id)
                    else:
                        # No jobs, sleep
                        await asyncio.sleep(2)
                        
            except Exception as e:
                logger.error(f"Worker loop error: {e}", exc_info=True)
                await asyncio.sleep(5)
                
        logger.info("Worker stopped.")

    def stop(self):
        self.running = False


async def main():
    worker = Worker()
    
    # Graceful Shutdown
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: worker.stop())
        
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
