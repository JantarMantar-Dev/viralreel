import os
import logging
from typing import List, Dict, Optional
from moviepy import (
    AudioFileClip, ImageClip, concatenate_videoclips, 
    CompositeAudioClip, TextClip, CompositeVideoClip
)
# For v2, effects are often methods or in specific modules.
# We'll use the clip methods where available or manual imports if needed.
# Note: MoviePy 2.x uses 'with_' prefix for modifiers returning new clips.
# Checking installed version 2.1.2 usage.

from ..interfaces import IVideoComposer
from ..errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class MoviePyVideoComposer(IVideoComposer):
    def __init__(self):
        logger.info("Initializing MoviePyVideoComposer")

    async def compose_video(
        self, 
        audio_segments: List[str], 
        image_paths: List[str], 
        texts: List[str],
        subtitle_config: Dict, 
        background_music_path: Optional[str], 
        output_path: str
    ) -> str:
        
        logger.info("Starting MoviePy Composition (v2) with Subtitles...")
        
        if len(audio_segments) != len(image_paths):
            raise AppError("Mismatch between audio segments and images count", ErrorCode.INTERNAL_ERROR)

        clips = []
        
        # Subtitle defaults
        font = subtitle_config.get("font", "Arial-Bold")
        fontsize = subtitle_config.get("fontsize", 70)
        color = subtitle_config.get("color", "white")
        stroke_color = subtitle_config.get("stroke_color")
        bg_color = subtitle_config.get("bg_color")
        words_per_line = subtitle_config.get("words_per_line", 1)

        try:
            # 1. Create Clips (Image + Audio + Subtitles pairs)
            for audio_path, img_path, text in zip(audio_segments, image_paths, texts):
                # Load Audio
                audio_clip = AudioFileClip(audio_path)
                duration = audio_clip.duration
                
                # Create Image Clip
                img_clip = (
                    ImageClip(img_path)
                    .with_duration(duration)
                    .with_fps(24)
                )
                
                # Create Subtitle Clips
                subtitle_clips = []
                if text and subtitle_config:
                    words = text.split()
                    # Group words by words_per_line
                    chunks = [" ".join(words[i:i + words_per_line]) for i in range(0, len(words), words_per_line)]
                    
                    if chunks:
                        chunk_duration = duration / len(chunks)
                        for i, chunk in enumerate(chunks):
                            # MoviePy v2 TextClip can be tricky with None size
                            # We'll try to use a width-only size if possible, or cast the result.
                            clean_bg = bg_color[:7] if bg_color and bg_color.startswith("#") and len(bg_color) > 7 else bg_color
                            
                            target_w = int(img_clip.w * 0.9)
                            target_h = int(fontsize * 3)
                            
                            txt_clip = TextClip(
                                text=str(chunk),
                                font=str(font),
                                font_size=int(fontsize),
                                color=str(color),
                                stroke_color=str(stroke_color) if stroke_color else None,
                                stroke_width=int(2 if stroke_color else 0),
                                bg_color=clean_bg,
                                method='caption', 
                                size=(target_w, target_h)
                            )
                            
                            # v2: with_duration, with_start, with_position
                            txt_clip = (
                                txt_clip
                                .with_duration(float(chunk_duration))
                                .with_start(float(i * chunk_duration))
                                .with_position(('center', 'center'))
                            )
                            subtitle_clips.append(txt_clip)

                # Composite Image + Subtitles
                if subtitle_clips:
                    video_clip = CompositeVideoClip([img_clip] + subtitle_clips)
                else:
                    video_clip = img_clip
                
                # Set Audio
                video_clip = video_clip.with_audio(audio_clip)
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
                    bg_music = concatenate_audioclips([bg_music] * n).subclipped(0, final_clip.duration)
                else:
                    bg_music = bg_music.subclipped(0, final_clip.duration)
                
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
