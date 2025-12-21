import pytest
import os
from src.components.mocks import (
    MockScriptGenerator, MockTTSProvider, MockImageProvider,
    MockVideoComposer, MockStorageProvider
)

@pytest.mark.asyncio
async def test_mock_script_generator():
    generator = MockScriptGenerator()
    script = await generator.generate_script("Test Prompt", "SHORT", {})
    assert "sections" in script
    assert len(script["sections"]) == 2
    assert "image_prompt" in script["sections"][0]

@pytest.mark.asyncio
async def test_mock_tts_provider(tmp_path):
    tts = MockTTSProvider()
    output_file = tmp_path / "test_audio.mp3"
    duration = await tts.generate_audio("Hello", "voice_1", str(output_file))
    assert duration == 3.0
    assert output_file.exists()
    # Check for RIFF header (WAV)
    assert output_file.read_bytes().startswith(b"RIFF")

@pytest.mark.asyncio
async def test_mock_image_provider(tmp_path):
    img_gen = MockImageProvider()
    output_file = tmp_path / "test_image.png"
    path = await img_gen.generate_image("A cat", "oil painting", str(output_file))
    assert path == str(output_file)
    assert output_file.exists()
    # Check it's not empty, it's a real PNG/binary
    assert len(output_file.read_bytes()) > 0
    # Ideally check header, but >0 is enough for mock verification vs string content

@pytest.mark.asyncio
async def test_mock_composer(tmp_path):
    composer = MockVideoComposer()
    output_file = tmp_path / "final_video.mp4"
    # Update args to match signature: audio_segments, image_paths, texts, subtitle_config, background_music_path, output_path
    path = await composer.compose_video([], [], [], {}, None, str(output_file))
    assert path == str(output_file)
    assert output_file.exists()
    assert output_file.read_bytes() == b"Final Video Content"

@pytest.mark.asyncio
async def test_mock_storage():
    storage = MockStorageProvider()
    url = await storage.upload_file("any/path", "video.mp4")
    assert url == "https://mock-storage.com/video.mp4"
