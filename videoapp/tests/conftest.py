import pytest_asyncio
import pytest
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from models import ContentNiche

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(test_engine):
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def job_factory(db_session):
    from models import VideoGroup, VideoItem, VideoItemMetadata, VideoJob, ContentNiche, GroupType, Platform, JobStatus
    import uuid
    
    async def _create_job(
        status=JobStatus.QUEUED,
        script_payload=None
    ):
        # Ensure Niche
        niche_name = f"Test Niche {uuid.uuid4()}"
        niche = ContentNiche(name=niche_name)
        db_session.add(niche)
        await db_session.flush()
        
        # Ensure Group
        group = VideoGroup(
            name=f"Test Group {uuid.uuid4()}",
            user_id="test_user",
            group_type=GroupType.SINGLE,
            niche_id=niche.id
        )
        db_session.add(group)
        await db_session.flush()
        
        # Ensure Item
        item = VideoItem(
            group_id=group.id,
            niche_id=niche.id,
            title="Test Item"
        )
        db_session.add(item)
        await db_session.flush()
        
        # Ensure Metadata
        meta = VideoItemMetadata(
            item_id=item.id,
            master_prompt="Test Prompt",
            platform=Platform.TIKTOK,
            duration_category="SHORT",
            script_payload=script_payload
        )
        db_session.add(meta)
        
        # Create Job
        job = VideoJob(
            item_id=item.id,
            user_id="test_user",
            status=status
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)
        return job
        
    return _create_job
