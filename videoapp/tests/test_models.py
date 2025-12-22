import pytest
from sqlalchemy import select
from src.models import VideoGroup, VideoItem, GroupType
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from src.models import (
    VideoGroup, VideoItem, VideoItemMetadata, VideoJob,
    ContentNiche, ImageStyle, SubtitleStyle, MusicTrack, TTSVoice,
    GroupType, JobStatus, Platform
)
import uuid

@pytest.mark.asyncio
async def test_content_niche_crud(db_session):
    # Create
    niche = ContentNiche(
        name="Horror Stories",
        description="Scary stories for night time",
        script_prompt="Write a scary story...",
        video_prompt="Dark atmosphere..."
    )
    db_session.add(niche)
    await db_session.commit()
    
    # Read
    stmt = select(ContentNiche).where(ContentNiche.name == "Horror Stories")
    result = await db_session.execute(stmt)
    fetched_niche = result.scalar_one()
    assert fetched_niche.description == "Scary stories for night time"
    
    # Update
    fetched_niche.description = "Updated description"
    await db_session.commit()
    assert niche.description == "Updated description"
    
    # Delete
    await db_session.delete(niche)
    await db_session.commit()
    result = await db_session.execute(select(ContentNiche).where(ContentNiche.name == "Horror Stories"))
    assert result.scalar_one_or_none() is None

@pytest.mark.asyncio
async def test_style_models(db_session):
    # Image Style
    img_style = ImageStyle(name="Cinematic", prompt_modifier="8k resolution, realistic")
    db_session.add(img_style)
    
    # Subtitle Style
    sub_style = SubtitleStyle(name="Bold Yellow", font_color="#FFFF00", font_size=24)
    db_session.add(sub_style)
    
    # Music Track
    track = MusicTrack(name="Spooky Ambience", url="http://test.com/music.mp3", duration_seconds=120)
    db_session.add(track)
    
    # TTS Voice
    voice = TTSVoice(
        provider="OPENAI", 
        provider_voice_id="alloy", 
        name="Alloy", 
        gender="NEUTRAL"
    )
    db_session.add(voice)
    
    await db_session.commit()
    
    assert img_style.id is not None
    assert sub_style.id is not None
    assert track.id is not None
    assert voice.id is not None

@pytest.mark.asyncio
async def test_full_video_workflow_models(db_session):
    from sqlalchemy.orm import selectinload
    # 1. Setup Dependencies
    niche = ContentNiche(name="History Facts")
    voice = TTSVoice(provider="TEST", provider_voice_id="v1", name="Test Voice")
    db_session.add_all([niche, voice])
    await db_session.commit()
    
    # 2. Create Group
    group = VideoGroup(
        name="History Series",
        user_id="user_123",
        group_type=GroupType.SERIES,
        niche_id=niche.id
    )
    db_session.add(group)
    await db_session.commit()
    
    # 3. Create Item
    item = VideoItem(
        group_id=group.id,
        niche_id=niche.id,
        title="Rome Empire",
        episode_number=1
    )
    db_session.add(item)
    await db_session.commit()
    
    # 4. Create Metadata (with JSON and FKs)
    metadata = VideoItemMetadata(
        item_id=item.id,
        voice_id=voice.id,
        script_payload={"sections": [{"text": "Rome fell."}]},
        extra_parameters={"force_render": True},
        platform=Platform.TIKTOK,
        duration_category="SHORT"
    )
    db_session.add(metadata)
    await db_session.commit()
    
    # 5. Create Job
    job = VideoJob(
        item_id=item.id,
        user_id="user_123",
        status=JobStatus.QUEUED
    )
    db_session.add(job)
    await db_session.commit()
    
    # Verification
    # Check Item -> Metadata relationship
    stmt = (
        select(VideoItem)
        .where(VideoItem.id == item.id)
        .options(
            selectinload(VideoItem.metadata_rel),
            selectinload(VideoItem.jobs),
            selectinload(VideoItem.group)
        )
    )
    result = await db_session.execute(stmt)
    fetched_item = result.scalar_one()
    
    assert fetched_item.metadata_rel.platform == Platform.TIKTOK
    assert fetched_item.metadata_rel.script_payload["sections"][0]["text"] == "Rome fell."
    assert fetched_item.jobs[0].status == JobStatus.QUEUED
    assert fetched_item.group.name == "History Series"

@pytest.mark.asyncio
async def test_unique_constraints(db_session):
    # Content Niche Name verification
    n1 = ContentNiche(name="Unique Name")
    db_session.add(n1)
    await db_session.commit()
    
    n2 = ContentNiche(name="Unique Name")
    db_session.add(n2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()

    # VideoItem Metadata Unique Item ID verification
    # Create dependencies first
    niche_c = ContentNiche(name="Constraint Niche")
    db_session.add(niche_c)
    await db_session.commit()

    group_c = VideoGroup(
        name="Constraint Group",
        user_id="user_c",
        group_type=GroupType.SINGLE,
        niche_id=niche_c.id
    )
    db_session.add(group_c)
    await db_session.commit()

    item = VideoItem(
        group_id=group_c.id,
        title="Test Item"
    )
    db_session.add(item)
    await db_session.commit()
    
    m1 = VideoItemMetadata(item_id=item.id)
    db_session.add(m1)
    await db_session.commit()
    
    m2 = VideoItemMetadata(item_id=item.id) # Should fail, 1:1 relationship
    db_session.add(m2)
    
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()

