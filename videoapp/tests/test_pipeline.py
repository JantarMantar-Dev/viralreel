import pytest
import uuid
import os
from sqlalchemy import select
from src.models import (
    VideoGroup, VideoItem, VideoItemMetadata, VideoJob,
    ContentNiche, JobStatus, GroupType, Platform
)
from src.pipeline import VideoPipeline
from src.components.mocks import (
    MockScriptGenerator, MockTTSProvider, MockImageProvider,
    MockVideoComposer, MockStorageProvider
)

@pytest.mark.asyncio
async def test_video_pipeline_flow(db_session, tmp_path, job_factory):
    # 1. Setup Data using Factory
    job = await job_factory()
    
    # 2. Initialize Pipeline with Mocks
    # Inject tmp_path as work_dir
    pipeline = VideoPipeline(
        db_session=db_session,
        work_dir=str(tmp_path)
    )
    
    # 3. Process Job
    await pipeline.process_job(job.id)
    
    # 4. Verify
    await db_session.refresh(job)
    assert job.status == JobStatus.COMPLETED
    assert job.output_url == f"https://mock-storage.com/videos/{job.id}.mp4"
    assert job.completed_at is not None
    
    # Verify artifacts were created in tmp_path
    # Expected: 2 segments (from mock script) -> 2 audio, 2 images, 1 final video
    files = list(tmp_path.iterdir())
    filenames = [f.name for f in files]
    
    # 2 audio + 2 images + 1 video = 5 files
    # Check for specific patterns
    assert any(f.endswith("_final.mp4") for f in filenames)
    assert any(f.endswith("_seg0.mp3") for f in filenames)
