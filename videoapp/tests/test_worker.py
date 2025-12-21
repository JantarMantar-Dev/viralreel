import pytest
from src.worker import Worker
from src.models import VideoJob, JobStatus
from sqlalchemy import select

@pytest.mark.asyncio
async def test_worker_get_next_job(db_session, job_factory):
    # Setup
    worker = Worker()
    
    # Create Job via Factory
    job = await job_factory(status=JobStatus.QUEUED)
    
    # Test fetch
    fetched_job = await worker.get_next_job(db_session)
    assert fetched_job is not None
    assert fetched_job.id == job.id
    
    # Test fetch empty
    job.status = JobStatus.PROCESSING
    await db_session.commit()
    
    fetched_job_2 = await worker.get_next_job(db_session)
    assert fetched_job_2 is None
