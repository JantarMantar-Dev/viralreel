import os
import logging
import boto3
from botocore.exceptions import ClientError
from interfaces import IStorageProvider
from errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

class S3StorageProvider(IStorageProvider):
    def __init__(self):
        self.endpoint_url = os.getenv("S3_ENDPOINT_URL")
        self.access_key = os.getenv("S3_ACCESS_KEY_ID")
        self.secret_key = os.getenv("S3_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        self.region_name = os.getenv("S3_REGION", "us-east-1")

        if not all([self.endpoint_url, self.access_key, self.secret_key, self.bucket_name]):
             logger.warning("S3 credentials missing. S3StorageProvider might fail.")
        
        try:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region_name
            )
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            self.s3_client = None

    async def upload_file(self, file_path: str, destination_key: str) -> str:
        if not self.s3_client:
             raise AppError("S3 Client not initialized", ErrorCode.INTERNAL_ERROR)

        if not os.path.exists(file_path):
             raise AppError(f"File not found: {file_path}", ErrorCode.INTERNAL_ERROR)

        try:
            logger.info(f"Uploading {file_path} to s3://{self.bucket_name}/{destination_key}")
            
            # Use run_in_executor for blocking boto3 calls if heavily used, 
            # but for simple uploads in a worker it's often acceptable or use aiobotocore.
            # For simplicity/standard usage here, we'll keep it sync but wrapped if needed later.
            # Adding ExtraArgs={'ACL': 'public-read'} if bucket policy allows/requires it for public access.
            # Assuming strictly private bucket or bucket policy handles public access for now.
            
            self.s3_client.upload_file(
                file_path, 
                self.bucket_name, 
                destination_key,
                ExtraArgs={'ContentType': 'video/mp4'} # Heuristic: Assume MP4 for now or guess mime
            )
            
            # Construct Public URL
            # Wasabi/S3 style: {endpoint}/{bucket}/{key}
            # Remove trailing slash from endpoint if present
            endpoint = self.endpoint_url.rstrip("/")
            public_url = f"{endpoint}/{self.bucket_name}/{destination_key}"
            
            return public_url

        except ClientError as e:
            logger.error(f"S3 Upload Failed: {e}", exc_info=True)
            raise AppError(f"S3 Upload Failed: {e}", ErrorCode.INTERNAL_ERROR)
        except Exception as e:
            logger.error(f"Unexpected Upload Error: {e}", exc_info=True)
            raise AppError(f"Upload Error: {e}", ErrorCode.INTERNAL_ERROR)
