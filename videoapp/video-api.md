# Video Creation API Design Specification

## Overview
This document outlines the architecture for a scalable, asynchronous video creation API tailored for "faceless reels". The system automates the production of vertical short-form videos (9:16) based on text stories, integrating TTS narration, background images, and overlay text.

## 1. System Architecture
The system follows an asynchronous Producer-Consumer pattern to handle potentially long-running video rendering tasks.

### High-Level Flow
1.  **Client** sends a `POST` request with the video script/story structure.
2.  **API Server** validates the request, saves it to the **Database** with status `QUEUED`, and returns a `job_id`.
3.  **Worker Pool** (running on separate threads/processes) picks up `QUEUED` jobs.
4.  **Video Processor** orchestrates:
    *   **TTS Generation**: Converts story text to audio segments.
    *   **Asset Retrieval**: Fetches or generates background images for each section.
    *   **Composition**: Combines Audio, Images, and Overlay Text into a video sequence using `moviepy` (or ffmpeg).
    *   **Storage**: Uploads the final `.mp4` to **Wasabi**.
5.  **Worker** updates Database status to `COMPLETED` with the file URL.

---



## 2. Database Schema & Migrations

### 2.1. Technology Stack
*   **Database**: PostgreSQL
*   **ORM**: SQLAlchemy (Async)
*   **Migrations**: Alembic

### 2.2. Detailed Schema Design

Hierarchy: **Niche (Optional) -> Group -> Item -> Job**.

#### Table: `content_niches`
Stores reusable configurations for specific content styles (e.g., "True Crime", "History").
```sql
CREATE TABLE content_niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, 
    description TEXT,
    icon_url VARCHAR(255), 
    
    script_prompt TEXT, 
    video_prompt TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `image_styles`
Visual presets (e.g., "Comic", "Realism", "3D Render").
These modify the image generation prompts.
```sql
CREATE TABLE image_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Comic', 'Realism'
    description TEXT, 
    prompt_modifier TEXT, -- The suffix added to prompts (e.g. "in bold comic-book style")
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `subtitle_styles`
Overlay text styling configs (e.g., "Classic CapCut", "Neon").
```sql
CREATE TABLE subtitle_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Bold Impact', 'Minimal Clean'
    
    font_name VARCHAR(50), -- 'Arial-Bold'
    font_size INTEGER,
    font_color VARCHAR(20) DEFAULT '#FFFFFF',
    stroke_color VARCHAR(20) DEFAULT '#000000',
    background_color VARCHAR(20), -- Optional colored box background
    
    default_words_per_line INTEGER DEFAULT 1, -- Default pacing
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `music_tracks`
Background audio library.
```sql
CREATE TABLE music_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 'Breathing Shadows'
    url VARCHAR(512) NOT NULL, -- S3 link
    mood VARCHAR(50), -- 'Dark', 'Uplifting'
    duration_seconds INTEGER,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `tts_voices`
Available narrator voices from providers (ElevenLabs, OpenAI, etc.).
```sql
CREATE TABLE tts_voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- 'ELEVENLABS', 'OPENAI'
    provider_voice_id VARCHAR(100) NOT NULL, -- The ID required by the external API
    
    name VARCHAR(100) NOT NULL, -- 'Adam', 'Bella'
    gender VARCHAR(20), -- 'MALE', 'FEMALE'
    language_code VARCHAR(10) DEFAULT 'en', -- 'en', 'es'
    preview_url VARCHAR(512), -- URL to sample audio
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `video_groups`
Top-level entity (Series or Single Project).
```sql
CREATE TABLE video_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL, -- Owner ID
    niche_id UUID REFERENCES content_niches(id) ON DELETE SET NULL, 
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_type VARCHAR(20) NOT NULL, 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_video_groups_type ON video_groups(group_type);
CREATE INDEX idx_video_groups_user ON video_groups(user_id);
```

#### Table: `video_items`
Core content registry. Minimal shell.
```sql
CREATE TABLE video_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES video_groups(id) ON DELETE CASCADE,
    niche_id UUID REFERENCES content_niches(id) ON DELETE SET NULL,
    
    episode_number INTEGER DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(group_id, episode_number)
);
```

#### Table: `video_item_metadata`
Stores content definition, configuration, and output details.

```sql
CREATE TABLE video_item_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES video_items(id) ON DELETE CASCADE,
    
    -- Visual & Audio Style
    image_style_id UUID REFERENCES image_styles(id) ON DELETE SET NULL,
    subtitle_style_id UUID REFERENCES subtitle_styles(id) ON DELETE SET NULL,
    background_music_id UUID REFERENCES music_tracks(id) ON DELETE SET NULL,
    voice_id UUID REFERENCES tts_voices(id) ON DELETE SET NULL, 
    
    -- Content Definition
    master_prompt TEXT, 
    script_payload JSONB, 
    
    -- Tech Specs & Platform
    platform VARCHAR(50), 
    aspect_ratio VARCHAR(20) DEFAULT '9:16',
    duration_category VARCHAR(20), 
    
    -- Pacing Config
    subtitle_words_per_line INTEGER, 
    
    -- Output
    output_url VARCHAR(512), 
    
    -- Config
    extra_parameters JSONB, 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_item_meta_item_id ON video_item_metadata(item_id);
```

#### Table: `video_jobs`
Primary table for tracking video generation requests.

```sql
CREATE TABLE video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES video_items(id) ON DELETE CASCADE,
    user_id VARCHAR(100), -- For quick lookup/filtering by user
    
    status VARCHAR(20) NOT NULL,
    priority INTEGER DEFAULT 0,
    
    worker_id VARCHAR(50), 
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    output_url VARCHAR(255),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_video_jobs_status ON video_jobs(status);
CREATE INDEX idx_video_jobs_item_id ON video_jobs(item_id);
CREATE INDEX idx_video_jobs_user ON video_jobs(user_id);
```

---

## 3. API Interface

The API is designed to be RESTful, using JSON payloads. All endpoints should ideally require authentication (omitted here for brevity).

### 3.1. Content, Styles & Assets
Manage specific content styles and presets.

*   **List Niches**: `GET /api/v1/niches`
*   **List Image Styles**: `GET /api/v1/styles/image`
*   **List Subtitle Styles**: `GET /api/v1/styles/subtitle`
*   **List Music Tracks**: `GET /api/v1/music`
*   **List TTS Voices**: `GET /api/v1/voices`

### 3.2. Unified Generation Endpoint
The primary entry point for creating content. Handles Single Videos, New Series, and New Episodes.

*   **Create Generation Request**
    *   `POST /api/v1/generate`
    *   **Description**: Creates the necessary database entities (Group/Item) and triggers the rendering Job.
    
    #### Scenario 1: Create Single Video (Standalone)
    Creates a `SINGLE` type Group and an Item implicitly.
    ```json
    {
      "user_id": "auth0|123",
      "group_config": {
        "type": "SINGLE",
        "name": "My Viral Video",
        "niche_id": "uuid-niche-optional"
      },
      "item_config": {
        "title": "The Video Title",
        "metadata": {
            "master_prompt": "...",
            "image_style_id": "...",
            "voice_id": "...",
            "duration_category": "SHORT",
            "platform": "TIKTOK"
        }
      }
    }
    ```

    #### Scenario 2: Start Brand New Series
    Creates a `SERIES` type Group and the first Episode (Item).
    ```json
    {
      "user_id": "auth0|123",
      "group_config": {
        "type": "SERIES",
        "name": "Haunted Places Series",
        "niche_id": "uuid-scary-niche"
      },
      "item_config": {
        "episode_number": 1,
        "title": "The Old Mansion",
        "metadata": { "master_prompt": "..." }
      }
    }
    ```

    #### Scenario 3: Add Episode to Existing Series
    Adds an Item to an existing Group ID.
    ```json
    {
      "user_id": "auth0|123",
      "group_id": "uuid-existing-group-id", 
      "item_config": {
        "episode_number": 2, // Optional, auto-increments
        "title": "The Abandoned Asylum",
        "metadata": { "master_prompt": "..." }
      }
    }
    ```

    *   **Response**:
        ```json
        {
          "job_id": "job-uuid",
          "group_id": "group-uuid", // New or Existing
          "item_id": "item-uuid",
          "status": "QUEUED"
        }
        ```

### 3.3. Management Endpoints
Secondary endpoints for updating or retrieving specific resources.

*   **Get Group Details**: `GET /api/v1/groups/{id}`
*   **Get Item Details**: `GET /api/v1/items/{id}`
*   **Update Item Metadata**: `PUT /api/v1/items/{id}/metadata`


*   **Update Item Script/Metadata**
    *   `PUT /api/v1/items/{id}/metadata`
    *   Payload:
        ```json
        {
          "script_payload": { ... }, // Update generated script manually
          "master_prompt": "Updated prompt..."
        }
        ```

*   **Get Item Details**
    *   `GET /api/v1/items/{id}`
    *   Response: Includes latest Metadata and latest Job status.

### 3.4. Job Execution (Rendering)
Trigger the actual video generation process.

*   **Trigger Render (Start Job)**
    *   `POST /api/v1/items/{id}/render`
    *   **Description**: Creates a new `video_jobs` entry for the item. The Worker will fetch the Item's linked Metadata (Style, Music, Script) to execute the job.
    *   Payload (Optional overrides for this specific run):
        ```json
        {
          "force_new_assets": true // e.g., re-generate images
        }
        ```
    *   Response:
        ```json
        {
          "job_id": "job_uuid",
          "status": "QUEUED",
          "queue_position": 1
        }
        ```

*   **Get Job Status**
    *   `GET /api/v1/jobs/{id}`
    *   Response:
        ```json
        {
          "id": "job_uuid",
          "status": "PROCESSING",
          "progress": 45, // Optional percentage
          "output_url": null,
          "error_message": null
        }
        ```

*   **Webhook (Recommended)**
    *   The system should preferably support webhooks to notify when `job.status` changes to `COMPLETED` or `FAILED`, avoiding aggressive polling.



---

## 4. Component Interfaces (Python)
To ensure maintainability and modularity ("extract any one out"), we define abstract base classes (interfaces).

### 4.1. Script Generator (LLM)
Handles the creative aspect: converting prompts into structured scripts.
```python
from abc import ABC, abstractmethod
from typing import List, Dict

class IScriptGenerator(ABC):
    @abstractmethod
    async def generate_script(self, prompt: str, duration_category: str, niche_config: Dict) -> Dict:
        """
        Uses LLM (e.g. OpenAI/Claude) to generate a structured script.
        Returns: { "sections": [ { "text": "...", "image_prompt": "..." } ] }
        """
        pass
```

### 4.2. TTS Provider
Handles text-to-speech generation.
```python
class ITTSProvider(ABC):
    @abstractmethod
    async def generate_audio(self, text: str, voice_id: str, output_path: str) -> float:
        """
        Generates audio file from text.
        Returns: Duration of audio in seconds.
        """
        pass
```

### 4.3. Image Provider
Handles background image generation.
```python
class IImageProvider(ABC):
    @abstractmethod
    async def generate_image(self, prompt: str, style_modifier: str, output_path: str) -> str:
        """
        Generates image based on prompt + style.
        Returns: Local file path of the image.
        """
        pass
```

### 4.4. Video Composer
The core rendering engine (e.g., MoviePy).
```python
class IVideoComposer(ABC):
    @abstractmethod
    async def compose_video(
        self, 
        audio_segments: List[str], 
        image_paths: List[str], 
        subtitle_config: Dict, 
        background_music_path: str,
        output_path: str
    ) -> str:
        """
        Assembles all assets into final video.
        - Synchronizes images to audio duration
        - Overlays subtitles (w/ styling)
        - Mixes background music (ducking during speech)
        """
        pass
```

### 4.5. Storage Provider
Handles uploading final assets.
```python
class IStorageProvider(ABC):
    @abstractmethod
    async def upload_file(self, file_path: str, destination_key: str) -> str:
        """
        Uploads local file to cloud storage (Wasabi/S3).
        Returns: Public/Presigned URL.
        """
        pass
```

---

## 5. Workflow Logic (The Engine)

The `VideoPipeline` class coordinates these components.

1.  **Job Pickup**: Worker grabs a `QUEUED` job (`video_jobs`).
2.  **Context Loading**:
    *   Fetch `video_items` and `video_item_metadata` for the job.
    *   Fetch related `image_styles`, `subtitle_styles`, and `music_tracks`.
    *   Fetch `content_niches` config (if applicable).
3.  **Parallel Asset Generation**:
    *   **Script**: If empty, generate using LLM + `master_prompt` + `niche.script_prompt` + `duration_category`.
    *   **TTS**: Generate audio for each script section.
    *   **Images**: Generate images using `image_style.prompt_modifier` + `niche.image_prompt_style`.
4.  **Composition**:
    *   **Audio Mix**: Merge TTS + Background Music (adjust volume).
    *   **Visuals**: Sequence images with transitions.
    *   **Subtitles**: Overlay text using `subtitle_style` (font, color, stroke) and `subtitle_words_per_line` pacing.
5.  **Render & Upload**:
    *   Write `.mp4`.
    *   Upload to **Wasabi**.
6.  **Completion**: Update `video_item_metadata.output_url` and `video_jobs.status`.

---

## 6. Configuration & Scalability
*   **Concurrency**: Use `ThreadPoolExecutor` or `ProcessPoolExecutor` (since video rendering is CPU bound) to handle multiple jobs.
*   **Config**:
    *   `MAX_CONCURRENT_JOBS`: 2-4 (depending on CPU cores).
    *   `WASABI_ACCESS_KEY` / `SECRET`.
    *   `TTS_API_KEY`.
