import pytest
import os
from unittest.mock import patch, MagicMock
from constants import VIDEO_PROVIDER_SCRIPT, VIDEO_PROVIDER_TTS, VIDEO_PROVIDER_IMAGE
from pipeline import VideoPipeline
from components.mocks import MockScriptGenerator, MockTTSProvider
from components.google import GoogleScriptGenerator, GoogleTTSProvider
from components.storage import S3StorageProvider
from components.composer import MoviePyVideoComposer

@pytest.mark.asyncio
async def test_pipeline_default_providers(db_session):
    # Default should be Mock
    pipeline = VideoPipeline(db_session=db_session)
    assert isinstance(pipeline.script_gen, MockScriptGenerator)
    assert isinstance(pipeline.tts, MockTTSProvider)

@patch("pipeline.GoogleScriptGenerator")
@patch("pipeline.GoogleTTSProvider")
@patch("pipeline.GoogleImageProvider")
@patch("pipeline.S3StorageProvider")
@patch("pipeline.MoviePyVideoComposer")
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
