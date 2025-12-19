import os
import logging
from typing import List, Dict, Optional
from moviepy import (
    AudioFileClip, ImageClip, concatenate_videoclips, 
    CompositeAudioClip
)
# For v2, effects are often methods or in specific modules.
# We'll use the clip methods where available or manual imports if needed.
# Note: MoviePy 2.x uses 'with_' prefix for modifiers returning new clips.
# Checking installed version 2.1.2 usage.

from ..interfaces import IVideoComposer
from ..errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class MoviePyVideoComposer(IVideoComposer):
    async def compose_video(
        self, 
        audio_segments: List[str], 
        image_paths: List[str], 
        subtitle_config: Dict, 
        background_music_path: Optional[str], 
        output_path: str
    ) -> str:
        
        logger.info("Starting MoviePy Composition (v2)...")
        
        if len(audio_segments) != len(image_paths):
            raise AppError("Mismatch between audio segments and images count", ErrorCode.INTERNAL_ERROR)

        clips = []
        
        try:
            # 1. Create Clips (Image + Audio pairs)
            for audio_path, img_path in zip(audio_segments, image_paths):
                # Load Audio
                audio_clip = AudioFileClip(audio_path)
                
                # Create Image Clip
                # v2: ImageClip(path)
                # Modifiers: with_duration, with_fps
                img_clip = (
                    ImageClip(img_path)
                    .with_duration(audio_clip.duration)
                    .with_fps(24)
                )
                
                # Set Audio
                video_clip = img_clip.with_audio(audio_clip)
                
                clips.append(video_clip)

            # 2. Concatenate
            final_clip = concatenate_videoclips(clips, method="compose")
            
            # 3. Add Background Music
            if background_music_path and os.path.exists(background_music_path):
                logger.info(f"Adding background music: {background_music_path}")
                bg_music = AudioFileClip(background_music_path)
                
                # Loop/Crop
                # v2: audio_loop is likely an effect or we manually loop
                # Simplest manual loop:
                if bg_music.duration < final_clip.duration:
                    # n_loops = int(final_clip.duration / bg_music.duration) + 1
                    # bg_music = concatenate_videoclips([bg_music] * n_loops).subclip(0, final_clip.duration)
                    # OR use afx.audio_loop if importable. 
                    # For safety in v2 without digging deep into changed paths, simple concat loop:
                    from math import ceil
                    n = ceil(final_clip.duration / bg_music.duration)
                    # Audio concatenation
                    from moviepy import concatenate_audioclips
                    bg_music = concatenate_audioclips([bg_music] * n).subclip(0, final_clip.duration)
                else:
                    bg_music = bg_music.subclip(0, final_clip.duration)
                
                # Volume Ducking
                # v2: with_volume_scaled(factor)
                try:
                    bg_music = bg_music.with_volume_scaled(0.15)
                except AttributeError:
                    # Fallback if method name differs (e.g. volumex)
                    # but with_volume_scaled is standard v2
                    pass
                
                # Composite
                final_audio = CompositeAudioClip([final_clip.audio, bg_music])
                final_clip = final_clip.with_audio(final_audio)

            # 4. Write Output
            logger.info(f"Writing video to {output_path}")
            final_clip.write_videofile(
                output_path, 
                codec='libx264', 
                audio_codec='aac', 
                fps=24,
                preset='ultrafast',
                logger=None
            )
            
            # Cleanup
            final_clip.close()
            for c in clips:
                c.close()
                
            return output_path

        except Exception as e:
            logger.error(f"MoviePy Composition Failed: {e}", exc_info=True)
            raise AppError(f"Video Composition Failed: {e}", ErrorCode.INTERNAL_ERROR)
