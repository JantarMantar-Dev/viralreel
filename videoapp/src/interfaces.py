from abc import ABC, abstractmethod
from typing import List, Dict, Optional

class IScriptGenerator(ABC):
    @abstractmethod
    async def generate_script(self, prompt: str, duration_category: str, niche_config: Dict) -> Dict:
        """
        Uses LLM (e.g. OpenAI/Claude) to generate a structured script.
        Returns: { "sections": [ { "text": "...", "image_prompt": "..." } ] }
        """
        pass

class ITTSProvider(ABC):
    @abstractmethod
    async def generate_audio(self, text: str, voice_id: str, output_path: str) -> float:
        """
        Generates audio file from text.
        Returns: Duration of audio in seconds.
        """
        pass

class IImageProvider(ABC):
    @abstractmethod
    async def generate_image(self, prompt: str, style_modifier: str, output_path: str) -> str:
        """
        Generates image based on prompt + style.
        Returns: Local file path of the image.
        """
        pass

class IVideoComposer(ABC):
    @abstractmethod
    async def compose_video(
        self, 
        audio_segments: List[str], 
        image_paths: List[str], 
        texts: List[str],
        subtitle_config: Dict, 
        background_music_path: Optional[str],
        output_path: str
    ) -> str:
        """
        Assembles all assets into final video.
        - Synchronizes images to audio duration
        - Overlays subtitles (w/ styling)
        - Mixes background music (ducking during speech)
        """
        pass

class IStorageProvider(ABC):
    @abstractmethod
    async def upload_file(self, file_path: str, destination_key: str) -> str:
        """
        Uploads local file to cloud storage (Wasabi/S3).
        Returns: Public/Presigned URL.
        """
        pass
