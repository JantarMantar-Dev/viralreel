import asyncio
import os
import logging
from dotenv import load_dotenv
from components.google import GoogleImageProvider

# Load Env
load_dotenv()

# Configure simple logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_image")

async def test_image_generation():
    # Force the model user wants to test
    os.environ["GOOGLE_IMAGE_MODEL"] = "gemini-3-pro-image-preview" 
    
    logger.info(f"Testing Model: {os.getenv('GOOGLE_IMAGE_MODEL')}")
    
    provider = GoogleImageProvider()
    
    output_file = "verify_gemini_image.png"
    if os.path.exists(output_file):
        os.remove(output_file)
        
    try:
        path = await provider.generate_image(
            prompt="A futuristic banana with neon lights in a cyberpunk city",
            style_modifier="Cinematic",
            output_path=output_file
        )
        logger.info(f"Success! Image saved to: {path}")
        
        # Verify file size
        size = os.path.getsize(path)
        logger.info(f"File Size: {size} bytes")
        
        if size < 10000:
             logger.warning("File is very small, might be stub or error.")
        else:
             logger.info("File size looks like a real image.")
             
    except Exception as e:
        logger.error(f"Verification Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_image_generation())
