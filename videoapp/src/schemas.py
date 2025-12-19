from pydantic import BaseModel, Field, UUID4, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

# Enums (mirroring models.py for API usage)
class Platform(str, Enum):
    YOUTUBE = "YOUTUBE"
    TIKTOK = "TIKTOK"
    INSTAGRAM = "INSTAGRAM"
    FACEBOOK = "FACEBOOK"

class GroupType(str, Enum):
    SINGLE = "SINGLE"
    SERIES = "SERIES"

class DurationCategory(str, Enum):
    SHORT = "SHORT" # < 60s
    MEDIUM = "MEDIUM" # 1-3 mins
    LONG = "LONG" # > 3 mins

# --- Request Schemas ---

class CreateGroupRequest(BaseModel):
    name: str
    type: GroupType
    niche_id: Optional[UUID4] = None
    user_id: str
    description: Optional[str] = None

class VideoMetadataRequest(BaseModel):
    master_prompt: str
    platform: Platform
    duration_category: DurationCategory = DurationCategory.SHORT
    aspect_ratio: str = "9:16"
    
    # Style Overrides (Optional)
    image_style_id: Optional[UUID4] = None
    subtitle_style_id: Optional[UUID4] = None
    background_music_id: Optional[UUID4] = None
    voice_id: Optional[UUID4] = None
    
    # Advanced
    script_payload: Optional[Dict[str, Any]] = None # Manual script
    extra_parameters: Optional[Dict[str, Any]] = None

class CreateItemRequest(BaseModel):
    group_id: UUID4
    title: str
    metadata: VideoMetadataRequest
    auto_render: bool = True # If true, automatically queues a job

# --- Response Schemas ---

class NicheResponse(BaseModel):
    id: UUID4
    name: str
    description: Optional[str]
    icon_url: Optional[str]

    class Config:
        from_attributes = True

class VoiceResponse(BaseModel):
    id: UUID4
    name: str
    gender: Optional[str]
    preview_url: Optional[str]
    
    class Config:
        from_attributes = True

class GroupResponse(BaseModel):
    id: UUID4
    name: str
    group_type: GroupType
    niche_id: Optional[UUID4]
    
    class Config:
        from_attributes = True

class JobResponse(BaseModel):
    id: UUID4
    status: str
    output_url: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ItemResponse(BaseModel):
    id: UUID4
    group_id: UUID4
    title: str
    latest_job: Optional[JobResponse] = None
    
    class Config:
        from_attributes = True

class SubtitleStyleResponse(BaseModel):
    id: UUID4
    name: str
    font_name: Optional[str]
    font_size: Optional[int]
    font_color: Optional[str]
    stroke_color: Optional[str]
    background_color: Optional[str]
    
    class Config:
        from_attributes = True

class MusicTrackResponse(BaseModel):
    id: UUID4
    name: str
    mood: Optional[str]
    url: str
    
    class Config:
        from_attributes = True

class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
