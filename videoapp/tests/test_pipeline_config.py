import pytest
import os
from unittest.mock import patch, MagicMock
from src.constants import VIDEO_PROVIDER_SCRIPT, VIDEO_PROVIDER_TTS, VIDEO_PROVIDER_IMAGE
from src.pipeline import VideoPipeline
from src.components.mocks import MockScriptGenerator, MockTTSProvider
from src.components.google import GoogleScriptGenerator, GoogleTTSProvider
from src.components.storage import S3StorageProvider
from src.components.composer import MoviePyVideoComposer

@pytest.mark.asyncio
async def test_pipeline_default_providers(db_session):
    # Default should be Mock
    pipeline = VideoPipeline(db_session=db_session)
    assert isinstance(pipeline.script_gen, MockScriptGenerator)
    assert isinstance(pipeline.tts, MockTTSProvider)

@patch("src.pipeline.GoogleScriptGenerator")
@patch("src.pipeline.GoogleTTSProvider")
@patch("src.pipeline.GoogleImageProvider")
@patch("src.pipeline.S3StorageProvider")
@patch("src.pipeline.MoviePyVideoComposer")
@pytest.mark.asyncio
async def test_pipeline_google_providers(mock_composer, mock_storage, mock_img, mock_tts, mock_script, db_session):
    # Setup Mocks to avoid real init
    mock_script.return_value = MagicMock()
    mock_tts.return_value = MagicMock()
    mock_img.return_value = MagicMock()
    mock_storage.return_value = MagicMock()
    mock_composer.return_value = MagicMock()
    
    # Set Env Vars
    env_vars = {
        "VIDEO_PROVIDER_SCRIPT": "GOOGLE",
        "VIDEO_PROVIDER_TTS": "GOOGLE",
        "VIDEO_PROVIDER_IMAGE": "GOOGLE",
        "VIDEO_PROVIDER_STORAGE": "S3",
        "VIDEO_PROVIDER_COMPOSER": "MOVIEPY"
    }
    
    with patch.dict(os.environ, env_vars):
        pipeline = VideoPipeline(db_session=db_session)
        
        # Verify classes (mocked versions)
        # Since we mocked the class constructor, pipeline.script_gen will be the instance returned by mock_script()
        assert pipeline.script_gen == mock_script.return_value
        assert pipeline.tts == mock_tts.return_value
        assert pipeline.storage == mock_storage.return_value
        assert pipeline.composer == mock_composer.return_value
        
        mock_script.assert_called_once()
        mock_tts.assert_called_once()
        mock_storage.assert_called_once()
        mock_composer.assert_called_once()
