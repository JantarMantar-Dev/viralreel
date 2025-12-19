import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Enum, JSON, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Enums
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

class ContentNiche(Base):
    __tablename__ = "content_niches"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon_url = Column(String(255))
    
    script_prompt = Column(Text)
    video_prompt = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ImageStyle(Base):
    __tablename__ = "image_styles"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    prompt_modifier = Column(Text)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SubtitleStyle(Base):
    __tablename__ = "subtitle_styles"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    
    font_name = Column(String(50))
    font_size = Column(Integer)
    font_color = Column(String(20), default="#FFFFFF")
    stroke_color = Column(String(20), default="#000000")
    background_color = Column(String(20))
    
    default_words_per_line = Column(Integer, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MusicTrack(Base):
    __tablename__ = "music_tracks"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    url = Column(String(512), nullable=False)
    mood = Column(String(50))
    duration_seconds = Column(Integer)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TTSVoice(Base):
    __tablename__ = "tts_voices"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False) # 'ELEVENLABS', 'OPENAI'
    provider_voice_id = Column(String(100), nullable=False)
    
    name = Column(String(100), nullable=False)
    gender = Column(String(20))
    language_code = Column(String(10), default="en")
    preview_url = Column(String(512))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- Core Video Models ---

class VideoGroup(Base):
    __tablename__ = "video_groups"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), nullable=False, index=True)
    niche_id = Column(Uuid, ForeignKey("content_niches.id"), nullable=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    group_type = Column(String(20), nullable=False, index=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    items = relationship("VideoItem", back_populates="group", cascade="all, delete-orphan")
    niche = relationship("ContentNiche")

class VideoItem(Base):
    __tablename__ = "video_items"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    group_id = Column(Uuid, ForeignKey("video_groups.id"), nullable=False)
    niche_id = Column(Uuid, ForeignKey("content_niches.id"), nullable=True)
    
    episode_number = Column(Integer, default=1)
    title = Column(String(255), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    group = relationship("VideoGroup", back_populates="items")
    metadata_rel = relationship("VideoItemMetadata", back_populates="item", uselist=False, cascade="all, delete-orphan")
    jobs = relationship("VideoJob", back_populates="item", cascade="all, delete-orphan")

class VideoItemMetadata(Base):
    __tablename__ = "video_item_metadata"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    item_id = Column(Uuid, ForeignKey("video_items.id"), nullable=False, unique=True)
    
    # Visual & Audio Style Links
    image_style_id = Column(Uuid, ForeignKey("image_styles.id"), nullable=True)
    subtitle_style_id = Column(Uuid, ForeignKey("subtitle_styles.id"), nullable=True)
    background_music_id = Column(Uuid, ForeignKey("music_tracks.id"), nullable=True)
    voice_id = Column(Uuid, ForeignKey("tts_voices.id"), nullable=True)
    
    # Content Definition
    master_prompt = Column(Text)
    script_payload = Column(JSON) 
    
    # Tech Specs
    platform = Column(String(50))
    aspect_ratio = Column(String(20), default="9:16")
    duration_category = Column(String(20))
    
    # Pacing
    subtitle_words_per_line = Column(Integer)
    
    # Output
    output_url = Column(String(512))
    
    # Config
    extra_parameters = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    item = relationship("VideoItem", back_populates="metadata_rel")
    image_style = relationship("ImageStyle")
    subtitle_style = relationship("SubtitleStyle")
    background_music = relationship("MusicTrack")
    voice = relationship("TTSVoice")


class VideoJob(Base):
    __tablename__ = "video_jobs"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    item_id = Column(Uuid, ForeignKey("video_items.id"), nullable=True)
    user_id = Column(String(100), index=True)
    
    status = Column(String(20), nullable=False, index=True) # QUEUED, PROCESSING...
    priority = Column(Integer, default=0)
    
    worker_id = Column(String(50))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    output_url = Column(String(255))
    error_message = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    item = relationship("VideoItem", back_populates="jobs")
