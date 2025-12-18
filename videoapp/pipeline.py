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

logger = logging.getLogger(__name__)

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
        
        os.makedirs(self.work_dir, exist_ok=True)

    async def _update_status(self, job_id: uuid.UUID, status: JobStatus, output_url: str = None, error: str = None):
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
        logger.info(f"Starting job {job_id}")
        await self._update_status(job_id, JobStatus.PROCESSING)
        
        try:
            # 1. Fetch Context
            result = await self.db.execute(
                select(VideoItem).where(VideoItem.jobs.any(VideoJob.id == job_id))
            )
            item = result.scalar_one_or_none()
            if not item:
                raise AppError(f"Job {job_id} has no associated item", ErrorCode.NOT_FOUND)
            
            # Need eager load of metadata usually, but let's assume session is active
            # (Note: In Prod, better to ensure eager load or join)
            meta = await self.db.get(VideoItemMetadata, item.id)    # Assuming metadata ID is same PK logic or via FK. 
                                                                    # Actually model has 1:1, let's query via relationship or FK. 
                                                                    # VideoItemMetadata.item_id == item.id
            result_meta = await self.db.execute(select(VideoItemMetadata).where(VideoItemMetadata.item_id == item.id))
            meta = result_meta.scalar_one()

            # 2. Generate Script
            # If manual script is provided in script_payload, use it. Else generate.
            script = meta.script_payload
            if not script or not script.get("sections"):
                logger.info("Generating script...")
                script = await self.script_gen.generate_script(
                    prompt=meta.master_prompt,
                    duration_category=meta.duration_category,
                    niche_config={} # Retrieve niche config if needed
                )
                # Save generated script back to DB
                meta.script_payload = script
                await self.db.commit()

            # 3. Generate Audio & Images per Section
            audio_paths = []
            image_paths = []
            
            for idx, section in enumerate(script["sections"]):
                # Audio
                text = section.get("text")
                voice_id = str(meta.voice_id) if meta.voice_id else "default_voice"
                audio_path = os.path.join(self.work_dir, f"{job_id}_seg{idx}.mp3")
                
                await self.tts.generate_audio(text, voice_id, audio_path)
                audio_paths.append(audio_path)
                
                # Image
                img_prompt = section.get("image_prompt") or text # Fallback
                img_style = "Cinematic" # Fetch from DB style if exists
                img_path = os.path.join(self.work_dir, f"{job_id}_seg{idx}.png")
                
                await self.image_gen.generate_image(img_prompt, img_style, img_path)
                image_paths.append(img_path)

            # 4. Compose Video
            final_video_path = os.path.join(self.work_dir, f"{job_id}_final.mp4")
            await self.composer.compose_video(
                audio_segments=audio_paths,
                image_paths=image_paths,
                subtitle_config={},
                background_music_path=None, 
                output_path=final_video_path
            )

            # 5. Upload
            public_url = await self.storage.upload_file(final_video_path, f"videos/{job_id}.mp4")

            # 6. Complete
            await self._update_status(job_id, JobStatus.COMPLETED, output_url=public_url)
            logger.info(f"Job {job_id} completed successfully.")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}", exc_info=True)
            await self._update_status(job_id, JobStatus.FAILED, error=str(e))
            # Re-raise or swallow? Swallow is safer for worker loop, providing status is updated.
