import pytest
from unittest.mock import MagicMock, patch
from src.components.google import GoogleScriptGenerator, GoogleTTSProvider, GoogleImageProvider

# --- Script Generator Tests ---

@patch("src.components.google.genai.Client")
@pytest.mark.asyncio
async def test_google_script_generator_generate(mock_client_cls):
    # Setup Mock
    mock_client = MagicMock()
    mock_models = MagicMock()
    mock_response = MagicMock()
    
    # Response structure for generate_content
    mock_response.text = '{"sections": [{"text": "Hello", "image_prompt": "World"}]}'
    mock_models.generate_content.return_value = mock_response
    mock_client.models = mock_models
    
    mock_client_cls.return_value = mock_client
    
    with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake_key"}):
        gen = GoogleScriptGenerator()
        script = await gen.generate_script("Prompt", "SHORT", {})
        
        assert script["sections"][0]["text"] == "Hello"
        mock_models.generate_content.assert_called_once()


# --- Image Tests ---

@patch("src.components.google.genai.Client")
@pytest.mark.asyncio
async def test_google_image_provider_gen(mock_client_cls, tmp_path):
    # Setup Mock
    mock_client = MagicMock()
    mock_models = MagicMock()
    mock_response = MagicMock()
    
    # Response structure for generate_content (used by GoogleImageProvider now)
    mock_part = MagicMock()
    mock_part.inline_data.data = b"fake_png_bytes"
    mock_response.parts = [mock_part]
    
    # We must mock generate_content, NOT generate_images
    mock_models.generate_content.return_value = mock_response
    mock_client.models = mock_models
    
    mock_client_cls.return_value = mock_client
    
    output = tmp_path / "image.png"
    
    with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake_key", "GOOGLE_IMAGE_MODEL": "gemini-3-pro-image-preview"}):
        provider = GoogleImageProvider()
        path = await provider.generate_image("A cat", "oil", str(output))
        
        assert path == str(output)
        assert output.read_bytes() == b"fake_png_bytes"
        mock_models.generate_content.assert_called_once()

# --- TTS Tests (unchanged mostly, but verifying) ---

@patch("google.cloud.texttospeech.TextToSpeechClient")
@pytest.mark.asyncio
async def test_google_tts_provider(mock_tts_client_cls, tmp_path):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.audio_content = b"fake_audio"
    mock_client.synthesize_speech.return_value = mock_response
    mock_tts_client_cls.return_value = mock_client
    
    provider = GoogleTTSProvider()
    output = tmp_path / "out.mp3"
    await provider.generate_audio("Text", "Voice", str(output))
    
    assert output.read_bytes() == b"fake_audio"
