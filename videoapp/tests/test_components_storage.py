import pytest
import os
from unittest.mock import MagicMock, patch
from components.storage import S3StorageProvider
from errors import AppError

@patch("boto3.client")
@pytest.mark.asyncio
async def test_s3_storage_init(mock_boto):
    # Setup Env
    env = {
        "S3_ENDPOINT_URL": "https://s3.wasabisys.com",
        "S3_ACCESS_KEY_ID": "key",
        "S3_SECRET_ACCESS_KEY": "secret",
        "S3_BUCKET_NAME": "my-bucket"
    }
    
    with patch.dict(os.environ, env):
        provider = S3StorageProvider()
        
        mock_boto.assert_called_with(
            's3',
            endpoint_url="https://s3.wasabisys.com",
            aws_access_key_id="key",
            aws_secret_access_key="secret",
            region_name="us-east-1"
        )
        assert provider.s3_client is not None

@patch("boto3.client")
@pytest.mark.asyncio
async def test_s3_upload(mock_boto, tmp_path):
    # Setup Mock
    mock_client = MagicMock()
    mock_boto.return_value = mock_client
    
    # Setup File
    test_file = tmp_path / "video.mp4"
    test_file.write_text("content")
    
    env = {
        "S3_ENDPOINT_URL": "https://s3.wasabisys.com",
        "S3_ACCESS_KEY_ID": "key",
        "S3_SECRET_ACCESS_KEY": "secret",
        "S3_BUCKET_NAME": "my-bucket"
    }
    
    with patch.dict(os.environ, env):
        provider = S3StorageProvider()
        url = await provider.upload_file(str(test_file), "folder/video.mp4")
        
        # Verify Call
        mock_client.upload_file.assert_called_with(
            str(test_file),
            "my-bucket",
            "folder/video.mp4",
            ExtraArgs={'ContentType': 'video/mp4'}
        )
        
        # Verify URL construction
        assert url == "https://s3.wasabisys.com/my-bucket/folder/video.mp4"

@pytest.mark.asyncio
async def test_s3_upload_missing_file():
    provider = S3StorageProvider()
    # Mocking init via env not needed if we mock client or just test logic before client call
    # But init checks env. Let's patch env just in case log warning.
    
    with pytest.raises(AppError) as exc:
        await provider.upload_file("/non/existent/file.mp4", "key")
        
    assert "File not found" in str(exc.value)
