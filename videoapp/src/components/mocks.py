from typing import List, Dict, Optional
import json
import asyncio
from ..interfaces import (
    IScriptGenerator, ITTSProvider, IImageProvider, 
    IVideoComposer, IStorageProvider
)

class MockScriptGenerator(IScriptGenerator):
    async def generate_script(self, prompt: str, duration_category: str, niche_config: Dict) -> Dict:
        # Simulate network delay
        await asyncio.sleep(0.5)
        return {
            "sections": [
                {
                    "text": "This is a mock script section 1.",
                    "image_prompt": f"Scene 1 visual for {prompt}"
                },
                {
                    "text": "This is a mock script section 2.",
                    "image_prompt": f"Scene 2 visual for {prompt}"
                }
            ]
        }

import wave
from PIL import Image, ImageDraw

class MockTTSProvider(ITTSProvider):
    async def generate_audio(self, text: str, voice_id: str, output_path: str) -> float:
        await asyncio.sleep(0.5)
        # Create a valid WAV file (silent)
        # MoviePy can handle WAV even if we name it .mp3 usually, but safer to respect format if checked.
        # But pipeline usually expects mp3 key. We'll write WAV headers.
        try:
            with wave.open(output_path, 'wb') as wav_file:
                # Set parameters: nchannels, sampwidth, framerate, nframes, comptype, compname
                wav_file.setnchannels(1) # Mono
                wav_file.setsampwidth(2) # 2 bytes
                wav_file.setframerate(44100)
                nframes = 44100 * 3 # 3 seconds
                wav_file.writeframes(b'\x00' * 2 * nframes)
            return 3.0
        except Exception as e:
            # Fallback for some reason
            with open(output_path, "wb") as f:
                 f.write(b'\0' * 1024)
            return 1.0

class MockImageProvider(IImageProvider):
    async def generate_image(self, prompt: str, style_modifier: str, output_path: str) -> str:
        await asyncio.sleep(0.5)
        # Create a valid Image via PIL
        try:
            # User requested black images for dev
            img = Image.new('RGB', (720, 1280), color = (0, 0, 0))
            d = ImageDraw.Draw(img)
            d.text((10,10), f"Mock Image\n{prompt[:30]}...", fill=(255,255,0))
            img.save(output_path)
        except ImportError:
             # Fallback if PIL missing (shouldn't happen with moviepy installed)
             with open(output_path, "wb") as f:
                 f.write(b'\0' * 1024)
        return output_path

class MockVideoComposer(IVideoComposer):
    async def compose_video(
        self, 
        audio_segments: List[str], 
        image_paths: List[str], 
        texts: List[str],
        subtitle_config: Dict, 
        background_music_path: Optional[str],
        output_path: str
    ) -> str:
        await asyncio.sleep(1.0)
        # Simulate rendering
        with open(output_path, "w") as f:
            f.write("Final Video Content")
        return output_path

class MockStorageProvider(IStorageProvider):
    async def upload_file(self, file_path: str, destination_key: str) -> str:
        await asyncio.sleep(0.5)
        return f"https://mock-storage.com/{destination_key}"
