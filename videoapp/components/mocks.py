from typing import List, Dict, Optional
import json
import asyncio
from interfaces import (
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

class MockTTSProvider(ITTSProvider):
    async def generate_audio(self, text: str, voice_id: str, output_path: str) -> float:
        await asyncio.sleep(0.5)
        # Create a dummy file
        with open(output_path, "w") as f:
            f.write(f"Audio content for: {text}")
        return 5.0 # Mock duration in seconds

class MockImageProvider(IImageProvider):
    async def generate_image(self, prompt: str, style_modifier: str, output_path: str) -> str:
        await asyncio.sleep(0.5)
        # Create a dummy image file
        with open(output_path, "w") as f:
            f.write(f"Image content for: {prompt} with style {style_modifier}")
        return output_path

class MockVideoComposer(IVideoComposer):
    async def compose_video(
        self, 
        audio_segments: List[str], 
        image_paths: List[str], 
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
