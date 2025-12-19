from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid
from dotenv import load_dotenv

load_dotenv()

from .database import get_db
from .models import (
    VideoGroup, VideoItem, VideoItemMetadata, VideoJob,
    ContentNiche, TTSVoice, JobStatus
)
from . import schemas
from .errors import AppError, ResourceNotFoundError
from .schemas import ErrorResponse

from .logger import configure_logging

logger = configure_logging("api")

app = FastAPI(title="VideoGen API", version="1.0.0")

# Global Exception Handler
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    logger.error(f"AppError: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            code=exc.code,
            message=exc.message,
            details=exc.details
        ).model_dump()
    )

# Startup Event to Init DB (Optional if using Alembic, but good for local dev checks)
@app.on_event("startup")
async def on_startup():
    # await init_db() # We use Alembic now
    pass

# --- API V1 Router ---
# In a larger app, this would go into routers/

from fastapi import APIRouter
router = APIRouter(prefix="/api/v1")

@router.get("/niches", response_model=List[schemas.NicheResponse])
async def list_niches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ContentNiche))
    return result.scalars().all()

@router.get("/voices", response_model=List[schemas.VoiceResponse])
async def list_voices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TTSVoice).where(TTSVoice.is_active == True))
    return result.scalars().all()

@router.post("/groups", response_model=schemas.GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    request: schemas.CreateGroupRequest, 
    db: AsyncSession = Depends(get_db)
):
    new_group = VideoGroup(
        name=request.name,
        user_id=request.user_id,
        group_type=request.type,
        description=request.description,
        niche_id=request.niche_id
    )
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group

@router.post("/items", response_model=schemas.ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    request: schemas.CreateItemRequest,
    db: AsyncSession = Depends(get_db)
):
    # 1. Verify Group Exists
    group = await db.get(VideoGroup, request.group_id)
    if not group:
        raise ResourceNotFoundError(resource="VideoGroup", identifier=request.group_id)

    # 2. Derive Niche from Group for the Item
    niche_id = group.niche_id

    # 3. Create Item
    # Determine episode number (simple auto-increment logic or strictly passed? 
    # For now, simplistic: count existing items + 1)
    # real production logic would be more robust against race conditions
    result = await db.execute(select(VideoItem).where(VideoItem.group_id == group.id))
    current_count = len(result.scalars().all())
    
    new_item = VideoItem(
        group_id=group.id,
        niche_id=niche_id,
        title=request.title,
        episode_number=current_count + 1
    )
    db.add(new_item)
    await db.flush() # Flush to get ID for metadata

    # 4. Create Metadata
    meta_data = request.metadata
    new_metadata = VideoItemMetadata(
        item_id=new_item.id,
        master_prompt=meta_data.master_prompt,
        platform=meta_data.platform,
        duration_category=meta_data.duration_category,
        aspect_ratio=meta_data.aspect_ratio,
        image_style_id=meta_data.image_style_id,
        subtitle_style_id=meta_data.subtitle_style_id,
        background_music_id=meta_data.background_music_id,
        voice_id=meta_data.voice_id,
        script_payload=meta_data.script_payload,
        extra_parameters=meta_data.extra_parameters
    )
    db.add(new_metadata)

    # 5. Create Job if requested
    last_job = None
    if request.auto_render:
        new_job = VideoJob(
            item_id=new_item.id,
            user_id=group.user_id, # Inherit user from group
            status=JobStatus.QUEUED
        )
        db.add(new_job)
        last_job = new_job # For response

    await db.commit()
    await db.refresh(new_item)
    
    # Construct response manually or rely on ORM lazy load (which might fail in Pydantic v2 init depending on config)
    # Safer to construct a response object if eager loading isn't set up perfectly or just use return new_item
    # Schema expects 'latest_job'. If we just added one, we know it.
    
    return schemas.ItemResponse(
        id=new_item.id,
        group_id=new_item.group_id,
        title=new_item.title,
        latest_job=last_job
    )

@router.get("/jobs/{job_id}", response_model=schemas.JobResponse)
async def get_job_status(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(VideoJob, job_id)
    if not job:
        raise ResourceNotFoundError(resource="VideoJob", identifier=job_id)
    return job

app.include_router(router)
