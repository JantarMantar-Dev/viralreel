import asyncio
import sys
import os

# Add /app to path if needed, but we run from /app
sys.path.append("/app")

from src.database import engine
# Import models to register them with Base
from src.models import Base, VideoJob, VideoItem, VideoItemMetadata, VideoGroup, ContentNiche

async def main():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")

if __name__ == "__main__":
    asyncio.run(main())
