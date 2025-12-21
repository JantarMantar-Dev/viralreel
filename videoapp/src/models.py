import uuid
import enum
from datetime import datetime
from typing import List, Optional, Any, Dict
from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from sqlalchemy import Text, func

# Keep Enums as they are
class GroupType(str, enum.Enum):
    SINGLE = "SINGLE"
    SERIES = "SERIES"

class Platform(str, enum.Enum):
    YOUTUBE = "YOUTUBE"
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    FACEBOOK = "FACEBOOK"

class JobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

# --- Content Configuration Models ---

class ContentNiche(SQLModel, table=True):
    __tablename__ = "content_niches"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, max_length=100, nullable=False)
    description: Optional[str] = Field(default=None, sa_type=Text)
    icon_url: Optional[str] = Field(default=None, max_length=255)
    
    script_prompt: Optional[str] = Field(default=None, sa_type=Text)
    video_prompt: Optional[str] = Field(default=None, sa_type=Text)
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()}
    )

class ImageStyle(SQLModel, table=True):
    __tablename__ = "image_styles"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, max_length=50, nullable=False)
    description: Optional[str] = Field(default=None, sa_type=Text)
    prompt_modifier: Optional[str] = Field(default=None, sa_type=Text)
    is_active: bool = Field(default=True)
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )

class SubtitleStyle(SQLModel, table=True):
    __tablename__ = "subtitle_styles"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, max_length=50, nullable=False)
    
    font_name: Optional[str] = Field(default=None, max_length=50)
    font_size: Optional[int] = Field(default=None)
    font_color: Optional[str] = Field(default="#FFFFFF", max_length=20)
    stroke_color: Optional[str] = Field(default="#000000", max_length=20)
    background_color: Optional[str] = Field(default=None, max_length=20)
    
    default_words_per_line: Optional[int] = Field(default=1)
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )

class MusicTrack(SQLModel, table=True):
    __tablename__ = "music_tracks"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100, nullable=False)
    url: str = Field(max_length=512, nullable=False)
    mood: Optional[str] = Field(default=None, max_length=50)
    duration_seconds: Optional[int] = Field(default=None)
    
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )

class TTSVoice(SQLModel, table=True):
    __tablename__ = "tts_voices"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    provider: str = Field(max_length=50, nullable=False) # 'ELEVENLABS', 'OPENAI'
    provider_voice_id: str = Field(max_length=100, nullable=False)
    
    name: str = Field(max_length=100, nullable=False)
    gender: Optional[str] = Field(default=None, max_length=20)
    language_code: Optional[str] = Field(default="en", max_length=10)
    preview_url: Optional[str] = Field(default=None, max_length=512)
    
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )

# --- Core Video Models ---

class VideoGroup(SQLModel, table=True):
    __tablename__ = "video_groups"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(max_length=100, nullable=False, index=True)
    niche_id: Optional[uuid.UUID] = Field(default=None, foreign_key="content_niches.id")
    
    name: str = Field(max_length=255, nullable=False)
    description: Optional[str] = Field(default=None, sa_type=Text)
    group_type: str = Field(max_length=20, nullable=False, index=True) 
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()}
    )
    
    # Relationships
    items: List["VideoItem"] = Relationship(
        back_populates="group", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    niche: Optional[ContentNiche] = Relationship()

class VideoItem(SQLModel, table=True):
    __tablename__ = "video_items"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    group_id: uuid.UUID = Field(foreign_key="video_groups.id", nullable=False)
    niche_id: Optional[uuid.UUID] = Field(default=None, foreign_key="content_niches.id")
    
    episode_number: Optional[int] = Field(default=1)
    title: str = Field(max_length=255, nullable=False)
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()}
    )
    
    # Relationships
    group: VideoGroup = Relationship(back_populates="items")
    metadata_rel: Optional["VideoItemMetadata"] = Relationship(
        back_populates="item", 
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"}
    )
    jobs: List["VideoJob"] = Relationship(
        back_populates="item", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class VideoItemMetadata(SQLModel, table=True):
    __tablename__ = "video_item_metadata"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    item_id: uuid.UUID = Field(foreign_key="video_items.id", nullable=False, unique=True)
    
    # Visual & Audio Style Links
    image_style_id: Optional[uuid.UUID] = Field(default=None, foreign_key="image_styles.id")
    subtitle_style_id: Optional[uuid.UUID] = Field(default=None, foreign_key="subtitle_styles.id")
    background_music_id: Optional[uuid.UUID] = Field(default=None, foreign_key="music_tracks.id")
    voice_id: Optional[uuid.UUID] = Field(default=None, foreign_key="tts_voices.id")
    
    # Content Definition
    master_prompt: Optional[str] = Field(default=None, sa_type=Text)
    script_payload: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON)) 
    
    # Tech Specs
    platform: Optional[str] = Field(default=None, max_length=50)
    aspect_ratio: Optional[str] = Field(default="9:16", max_length=20)
    duration_category: Optional[str] = Field(default=None, max_length=20)
    
    # Pacing
    subtitle_words_per_line: Optional[int] = Field(default=None)
    
    # Output
    output_url: Optional[str] = Field(default=None, max_length=512)
    
    # Config
    extra_parameters: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()}
    )
    
    # Relationships
    item: VideoItem = Relationship(back_populates="metadata_rel")
    image_style: Optional[ImageStyle] = Relationship()
    subtitle_style: Optional[SubtitleStyle] = Relationship()
    background_music: Optional[MusicTrack] = Relationship()
    voice: Optional[TTSVoice] = Relationship()


class VideoJob(SQLModel, table=True):
    __tablename__ = "video_jobs"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    item_id: Optional[uuid.UUID] = Field(default=None, foreign_key="video_items.id")
    user_id: Optional[str] = Field(default=None, max_length=100, index=True)
    
    status: str = Field(max_length=20, nullable=False, index=True) # QUEUED, PROCESSING...
    priority: Optional[int] = Field(default=0)
    
    worker_id: Optional[str] = Field(default=None, max_length=50)
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    
    output_url: Optional[str] = Field(default=None, max_length=255)
    error_message: Optional[str] = Field(default=None, sa_type=Text)
    
    created_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()}
    )
    
    # Relationships
    item: Optional[VideoItem] = Relationship(back_populates="jobs")
