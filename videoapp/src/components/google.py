import os
import json
import logging
from typing import Dict, Optional, List
from google import genai
from google.genai import types
from google.cloud import texttospeech

from ..interfaces import IScriptGenerator, ITTSProvider, IImageProvider
from ..errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class GoogleScriptGenerator(IScriptGenerator):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not set. GoogleScriptGenerator will fail.")
        else:
            self.client = genai.Client(api_key=self.api_key)

    async def generate_script(self, prompt: str, duration_category: str, niche_config: Dict) -> Dict:
        if not self.api_key:
             raise AppError("Missing GOOGLE_API_KEY", ErrorCode.INTERNAL_ERROR)

        logger.info(f"Generating script with Gemini for prompt: {prompt}")
        
        system_prompt = f"""
        You represent a viral content creation AI. Create a video script for: "{prompt}".
        Duration: {duration_category} (Short < 60s, Medium 1-3m).
        Platform: TikTok/Shorts style. Hooks, fast pacing.
        
        Output MUST be valid JSON with this schema:
        {{
            "sections": [
                {{
                    "text": "Voiceover text...",
                    "image_prompt": "Detailed visual description for Image Gen AI..."
                }}
            ]
        }}
        """
        
        try:
            model_id = os.getenv("GOOGLE_SCRIPT_MODEL", "gemini-3-flash-preview")
            
            response = self.client.models.generate_content(
                model=model_id,
                contents=system_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            if not response.text:
                raise AppError("Gemini returned empty response", ErrorCode.INTERNAL_ERROR)
                
            script_data = json.loads(response.text)
            return script_data
            
        except Exception as e:
            logger.error(f"Gemini Script Gen failed: {e}", exc_info=True)
            raise AppError(f"Script Generation Failed: {e}", ErrorCode.INTERNAL_ERROR)

class GoogleTTSProvider(ITTSProvider):
    def __init__(self):
        # Assumes GOOGLE_APPLICATION_CREDENTIALS is set for google-cloud-texttospeech
        self.client = None

    def _get_client(self):
        if not self.client:
            try:
                self.client = texttospeech.TextToSpeechClient()
            except Exception as e:
                logger.error(f"Failed to init Google TTS Client: {e}")
                raise AppError("Google TTS Client Init Failed", ErrorCode.INTERNAL_ERROR)
        return self.client

    async def generate_audio(self, text: str, voice_id: str, output_path: str) -> float:
        client = self._get_client()
        
        # Simple mapping or use voice_id directly if it matches Google format (e.g. "en-US-Journey-F")
        # Default fallback
        if not voice_id or len(voice_id) < 5:
            voice_id = "en-US-Journey-F" # Journey voice is good for content
            
        language_code = "-".join(voice_id.split("-")[:2]) # "en-US"

        input_text = texttospeech.SynthesisInput(text=text)
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_id,
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        try:
            response = client.synthesize_speech(
                request={"input": input_text, "voice": voice, "audio_config": audio_config}
            )

            with open(output_path, "wb") as out:
                out.write(response.audio_content)
                
            estimate = len(text.split()) / 2.5 # Rough words per second
            return estimate

        except Exception as e:
            logger.error(f"Google TTS failed: {e}", exc_info=True)
            raise AppError(f"TTS Failed: {e}", ErrorCode.INTERNAL_ERROR)


class GoogleImageProvider(IImageProvider):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            logger.warning("GOOGLE_API_KEY missing for GoogleImageProvider.")

    async def generate_image(self, prompt: str, style_modifier: str, output_path: str) -> str:
        if not self.api_key:
             raise AppError("Missing GOOGLE_API_KEY", ErrorCode.INTERNAL_ERROR)

        try:
            # User request: "nano banana 3". Interpreted as "imagen-3.0-generate-001" or "imagen-3.0-fast-generate-001"
            # We'll default to the standard Imagen 3 model ID.
            model_id = os.getenv("GOOGLE_IMAGE_MODEL", "imagen-3.0-generate-001")
            
            logger.info(f"Generating image with {model_id} for prompt: {prompt}")
            
            # Check if using Gemini 3 image preview model which uses generate_content
            if "gemini" in model_id.lower() and "image" in model_id.lower():
                response = self.client.models.generate_content(
                    model=model_id,
                    contents=f"{prompt} . Style: {style_modifier}",
                )
                
                image_bytes = None
                if response.parts:
                    for part in response.parts:
                        if part.inline_data:
                            image_bytes = part.inline_data.data
                            break
                            
                if not image_bytes:
                     raise AppError("Gemini returned no inline image data", ErrorCode.INTERNAL_ERROR)
                     
                with open(output_path, "wb") as f:
                    f.write(image_bytes)
                return output_path

            # If not a Gemini Image model, raise error as we explicitly don't want Imagen
            raise AppError(
                f"Unsupported Image Model: {model_id}. Only Gemini Image models (e.g. 'gemini-3-pro-image-preview') are supported.", 
                ErrorCode.INTERNAL_ERROR
            )

        except Exception as e:
            logger.error(f"Imagen Generation failed: {e}", exc_info=True)
            # Stub behavior if real model fails or not accessible
            # raise AppError(f"Image Gen Failed: {e}", ErrorCode.INTERNAL_ERROR)
            
            # Fallback STUB for reliability during dev if API fails (common with new SDK/permissions)
            logger.warning("Falling back to Stub Image due to error.")
            from PIL import Image, ImageDraw
            img = Image.new('RGB', (1024, 1024), color = (200, 100, 100))
            d = ImageDraw.Draw(img)
            d.text((10,10), f"Imagen Error Stub\n{prompt}", fill=(255,255,255))
            img.save(output_path)
            return output_path
