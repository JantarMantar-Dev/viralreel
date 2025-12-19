import logging
import datetime
import os
import json # Added missing import
import uuid
from typing import Dict, Any, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .errors import AppError, ErrorCode
from .models import VideoJob, VideoItem, VideoItemMetadata, JobStatus, SubtitleStyle, MusicTrack
from .interfaces import (
    IScriptGenerator, ITTSProvider, IImageProvider, 
    IVideoComposer, IStorageProvider
)
from .components.mocks import (
    MockScriptGenerator, MockTTSProvider, MockImageProvider,
    MockVideoComposer, MockStorageProvider
)
from .components.google import (
    GoogleScriptGenerator, GoogleTTSProvider, GoogleImageProvider, GeminiTTSProvider
)
from .components.storage import S3StorageProvider
from .logger import configure_logging

logger = configure_logging("pipeline")

from .components.composer import MoviePyVideoComposer

class VideoPipeline:
    def __init__(
        self,
        db_session: AsyncSession,
        script_gen: IScriptGenerator = None,
        tts: ITTSProvider = None,
        image_gen: IImageProvider = None,
        composer: IVideoComposer = None,
        storage: IStorageProvider = None,
        work_dir: str = None
    ):
        self.db = db_session
        self.work_dir = work_dir or os.getenv("VIDEO_WORK_DIR", "/tmp/viralreel_work")
        
        # Load Providers based on Env or Defaults
        self.script_gen = script_gen or self._get_provider("SCRIPT", GoogleScriptGenerator, MockScriptGenerator)
        
        # TTS logic: Support GOOGLE or GEMINI
        self.tts = tts
        if not self.tts:
            tts_env = os.getenv("VIDEO_PROVIDER_TTS", "MOCK").upper()
            if tts_env == "GOOGLE":
                self.tts = GoogleTTSProvider()
            elif tts_env == "GEMINI":
                self.tts = GeminiTTSProvider()
            else:
                self.tts = MockTTSProvider()

        self.image_gen = image_gen or self._get_provider("IMAGE", GoogleImageProvider, MockImageProvider)
        
        self.composer = composer or self._get_provider("COMPOSER", MoviePyVideoComposer, MockVideoComposer, enable_value="MOVIEPY")
        
        self.storage = storage or self._get_provider("STORAGE", S3StorageProvider, MockStorageProvider, enable_value="S3")
        
        logger.info(f"VideoPipeline initialized. Workdir: {self.work_dir}")
        logger.info(f"Providers: Script={type(self.script_gen).__name__}, TTS={type(self.tts).__name__}, Image={type(self.image_gen).__name__}, Composer={type(self.composer).__name__}, Storage={type(self.storage).__name__}")

        
        os.makedirs(self.work_dir, exist_ok=True)

    def _get_provider(self, type_name: str, real_cls: Type, mock_cls: Type, enable_value: str = "GOOGLE"):
        """
        Selects provider based on VIDEO_PROVIDER_{TYPE} env var.
        Values: enable_value (e.g 'GOOGLE' or 'S3'), 'MOCK' (Default)
        """
        provider_env = os.getenv(f"VIDEO_PROVIDER_{type_name}", "MOCK").upper()
        if provider_env == enable_value:
            try:
                return real_cls()
            except Exception as e:
                logger.error(f"Failed to init {real_cls.__name__}, falling back to Mock. Error: {e}")
                return mock_cls()
        return mock_cls()

    async def _update_status(self, job_id: uuid.UUID, status: JobStatus, output_url: str = None, error: str = None):
        logger.debug(f"Updating job {job_id} to status: {status}")
        job = await self.db.get(VideoJob, job_id)
        if job:
            job.status = status
            if output_url:
                job.output_url = output_url
            if error:
                job.error_message = error
            
            if status == JobStatus.COMPLETED or status == JobStatus.FAILED:
                job.completed_at = datetime.datetime.utcnow()
            elif status == JobStatus.PROCESSING and not job.started_at:
                job.started_at = datetime.datetime.utcnow()
                
            await self.db.commit()

    async def process_job(self, job_id: uuid.UUID):
        """
        Main orchestration logic.
        """
        logger.info(f"Starting execution for job {job_id}")
        await self._update_status(job_id, JobStatus.PROCESSING)
        
        try:
            # 1. Fetch Context
            logger.info("Fetching job context and metadata...")
            result = await self.db.execute(
                select(VideoItem).where(VideoItem.jobs.any(VideoJob.id == job_id))
            )
            item = result.scalar_one_or_none()
            if not item:
                raise AppError(f"Job {job_id} has no associated item", ErrorCode.NOT_FOUND)
            
            # Need eager load of metadata usually, but let's assume session is active
            result_meta = await self.db.execute(select(VideoItemMetadata).where(VideoItemMetadata.item_id == item.id))
            meta = result_meta.scalar_one()
            logger.info(f"Context loaded. Item ID: {item.id}, Group ID: {item.group_id}")

            # 2. Generate Script
            script = meta.script_payload
            if not script or not script.get("sections"):
                logger.info("Script payload empty. Generating new script via AI...")
                script = await self.script_gen.generate_script(
                    prompt=meta.master_prompt,
                    duration_category=meta.duration_category,
                    niche_config={} # Retrieve niche config if needed
                )
                
                # Debug: Save Response
                if os.getenv("DEBUG_SAVE_RESPONSES", "False").lower() == "true":
                    try:
                        debug_path = os.path.join(self.work_dir, f"{job_id}_script_debug.json")
                        logger.info(f"Attempting to save script (Type: {type(script)}) to {debug_path}")
                        with open(debug_path, "w") as f:
                            json.dump(script, f, indent=2)
                        logger.info(f"Saved debug script to {debug_path}")
                    except Exception as e:
                        logger.error(f"Failed to save debug script: {e}", exc_info=True)

                logger.info("Script generated successfully.")
                # Save generated script back to DB
                meta.script_payload = script
                await self.db.commit()
            else:
                 logger.info("Using existing script payload.")

            # 3. Generate Audio & Images per Section
            logger.info(f"Starting Asset Generation for {len(script['sections'])} sections...")
            audio_paths = []
            image_paths = []
            
            for idx, section in enumerate(script["sections"]):
                logger.debug(f"Processing Section {idx+1}/{len(script['sections'])}")
                
                # Audio
                text = section.get("text")
                voice_id = str(meta.voice_id) if meta.voice_id else "default_voice"
                audio_path = os.path.join(self.work_dir, f"{job_id}_seg{idx}.mp3")
                
                logger.debug(f"Generating TTS for section {idx} (Voice: {voice_id})")
                await self.tts.generate_audio(text, voice_id, audio_path)
                audio_paths.append(audio_path)
                
                # Image
                base_prompt = section.get("image_prompt") or text # Fallback
                img_prompt = f"{base_prompt}. Aspect Ratio: {meta.aspect_ratio}"
                
                img_style = "Cinematic" # Fetch from DB style if exists. 
                img_path = os.path.join(self.work_dir, f"{job_id}_seg{idx}.png")
                
                logger.debug(f"Generating Image for section {idx}")
                await self.image_gen.generate_image(img_prompt, img_style, img_path)
                image_paths.append(img_path)

            logger.info("Asset Generation Complete.")

            # 4. Compose Video
            logger.info("Starting Video Composition...")
            final_video_path = os.path.join(self.work_dir, f"{job_id}_final.mp4")
            
            # Subtitle Config
            subtitle_config = {}
            if meta.subtitle_style_id:
                style = await self.db.get(SubtitleStyle, meta.subtitle_style_id)
                if style:
                    subtitle_config = {
                        "font": style.font_name,
                        "fontsize": style.font_size,
                        "color": style.font_color,
                        "stroke_color": style.stroke_color,
                        "bg_color": style.background_color,
                        "words_per_line": meta.subtitle_words_per_line or style.default_words_per_line or 1
                    }

            # Music Track
            music_path = None
            if meta.background_music_id:
                track = await self.db.get(MusicTrack, meta.background_music_id)
                if track and not track.url.startswith("mock://"):
                    music_path = track.url
                    logger.info(f"Using background music: {track.name} ({music_path})")

            # Collect texts
            texts = [s["text"] for s in script["sections"]]

            await self.composer.compose_video(
                audio_segments=audio_paths,
                image_paths=image_paths,
                texts=texts,
                subtitle_config=subtitle_config,
                background_music_path=music_path, 
                output_path=final_video_path
            )
            logger.info(f"Video Composed at: {final_video_path}")

            # 5. Upload
            logger.info("Uploading final video to storage...")
            public_url = await self.storage.upload_file(final_video_path, f"videos/{job_id}.mp4")
            logger.info(f"Upload Successful. URL: {public_url}")

            # 6. Complete
            await self._update_status(job_id, JobStatus.COMPLETED, output_url=public_url)
            logger.info(f"Job {job_id} FINISHED successfully.")

        except Exception as e:
            logger.error(f"Job {job_id} FAILED: {str(e)}", exc_info=True)
            await self._update_status(job_id, JobStatus.FAILED, error=str(e))
