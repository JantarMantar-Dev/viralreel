import logging
import datetime
import os
import uuid
from typing import Dict, Any, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from errors import AppError, ErrorCode
from models import VideoJob, VideoItem, VideoItemMetadata, JobStatus
from interfaces import (
    IScriptGenerator, ITTSProvider, IImageProvider, 
    IVideoComposer, IStorageProvider
)
from components.mocks import (
    MockScriptGenerator, MockTTSProvider, MockImageProvider,
    MockVideoComposer, MockStorageProvider
)
from logger import configure_logging

logger = configure_logging("pipeline")

class VideoPipeline:
    def __init__(
        self,
        db_session: AsyncSession,
        script_gen: IScriptGenerator = MockScriptGenerator(),
        tts: ITTSProvider = MockTTSProvider(),
        image_gen: IImageProvider = MockImageProvider(),
        composer: IVideoComposer = MockVideoComposer(),
        storage: IStorageProvider = MockStorageProvider(),
        work_dir: str = "/tmp/viralreel_work"
    ):
        self.db = db_session
        self.script_gen = script_gen
        self.tts = tts
        self.image_gen = image_gen
        self.composer = composer
        self.storage = storage
        self.work_dir = work_dir
        
        logger.info(f"VideoPipeline initialized. Workdir: {self.work_dir}")
        os.makedirs(self.work_dir, exist_ok=True)

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
                img_prompt = section.get("image_prompt") or text # Fallback
                img_style = "Cinematic" # Fetch from DB style if exists. 
                img_path = os.path.join(self.work_dir, f"{job_id}_seg{idx}.png")
                
                logger.debug(f"Generating Image for section {idx}")
                await self.image_gen.generate_image(img_prompt, img_style, img_path)
                image_paths.append(img_path)

            logger.info("Asset Generation Complete.")

            # 4. Compose Video
            logger.info("Starting Video Composition...")
            final_video_path = os.path.join(self.work_dir, f"{job_id}_final.mp4")
            await self.composer.compose_video(
                audio_segments=audio_paths,
                image_paths=image_paths,
                subtitle_config={},
                background_music_path=None, 
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
