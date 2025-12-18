import asyncio
import os
import uuid
from dotenv import load_dotenv

# Load env before imports to ensure config
load_dotenv()

# Override for Manual Run
os.environ["VIDEO_PROVIDER_COMPOSER"] = "MOVIEPY"
os.environ["VIDEO_PROVIDER_TTS"] = "MOCK" # User requested Mock TTS for now

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from models import Base, VideoJob, JobStatus, VideoItem, VideoItemMetadata, VideoGroup, ContentNiche, GroupType, Platform
from pipeline import VideoPipeline
from logger import configure_logging

logger = configure_logging("manual_run")

# Use local sqlite for manual test to avoid messing real DB if needed, or use real one.
# For manual test requested, "create one script ... run single job".
# We'll use a temporary SQLITE file to be self-contained OR use the real DB if expected.
# Given "use existing code", I'll try to use the configured DB if possible, but simplest is a standalone setup.
# Let's use a local file db for this script to be safe.
TEST_DB_FILE = "./manual_test.db"
TEST_DB_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

async def setup_db():
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)
        
    engine = create_async_engine(TEST_DB_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return engine

async def create_test_job(session):
    # Data Setup
    niche = ContentNiche(name="Manual Test Niche")
    session.add(niche)
    await session.flush()
    
    group = VideoGroup(
        name="Manual Test Group",
        user_id="manual_user",
        group_type=GroupType.SINGLE,
        niche_id=niche.id
    )
    session.add(group)
    await session.flush()
    
    item = VideoItem(
        group_id=group.id,
        niche_id=niche.id,
        title="Manual Test Video"
    )
    session.add(item)
    await session.flush()
    
    meta = VideoItemMetadata(
        item_id=item.id,
        master_prompt="A futuristic city with flying cars",
        platform=Platform.TIKTOK,
        duration_category="SHORT",
        # Force a simple script payload if we want to skip generation, 
        # BUT user said "ai should work as well" (script/image).
        # So we leave script_payload None to trigger generation.
        script_payload=None 
    )
    session.add(meta)
    
    job = VideoJob(
        item_id=item.id,
        user_id="manual_user",
        status=JobStatus.QUEUED
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job.id

async def main():
    logger.info("Starting Manual Job Run...")
    
    # 1. Setup DB
    engine = await setup_db()
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 2. Create Job
        job_id = await create_test_job(session)
        logger.info(f"Created Job {job_id}")
        
        # 3. Initialize Pipeline
        # Explicitly enabling MoviePy here via Env (set above)
        pipeline = VideoPipeline(db_session=session)
        
        # 4. Generate Dummy Background Music (if needed)
        # Pipeline expects 'background_music_id' to resolve to path? 
        # Actually Pipeline logic for background music:
        # logic: bg_music_path = self._resolve_asset_path(metadata.background_music_id)
        # We didn't implement asset library yet, so it might fail if ID is provided but file missing.
        # But we didn't provide background_music_id in Metadata above.
        # If we WANT background music, we need a file.
        # "we can use one test free mp3 file as backgorund music"
        # Let's create a dummy silent mp3 or use a path if user provided.
        # For now, we'll skip background music in this test unless we generate one.
        
        # 5. Process
        logger.info("Processing Job...")
        await pipeline.process_job(job_id)
        
        # 6. Check Result
        job = await session.get(VideoJob, job_id)
        logger.info(f"Job Finished. Status: {job.status}")
        if job.output_url:
            logger.info(f"Output: {job.output_url}")
        if job.error_message:
            logger.error(f"Error: {job.error_message}")

if __name__ == "__main__":
    asyncio.run(main())
