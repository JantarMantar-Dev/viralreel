import asyncio
import sys
import os
import uuid

# Add /app to path if needed (for docker)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import engine
from src.models import SubtitleStyle, MusicTrack, ContentNiche

import os
import boto3

async def download_if_missing(dest_path: str):
    if os.path.exists(dest_path):
        print(f"File already exists: {dest_path}")
        return
    
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    bucket = os.getenv("S3_BUCKET_NAME")
    key = "bgmusic/bg-2.mp3"
    
    print(f"Downloading {bucket}/{key} to {dest_path} via S3...")
    try:
        s3 = boto3.client('s3', 
            endpoint_url=os.getenv('S3_ENDPOINT_URL'),
            aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY')
        )
        s3.download_file(bucket, key, dest_path)
        print("Download complete.")
    except Exception as e:
        print(f"Failed to download music via S3: {e}")

async def seed():
    print("Seeding Subtitle Styles and Music Tracks...")
    
    app_env = os.getenv("APP_ENV", "prod")
    bg_music_url = os.getenv("BG_MUSIC_WASHABI_URL", "https://s3.wasabisys.com/viralai-dev/assets/bg-2.mp3")
    bg_music_dir = os.getenv("BG_MUSIC_DIR", "/app/bgmusic")
    dev_music_path = os.path.join(bg_music_dir, "bg-2.mp3")

    if app_env == "dev":
        await download_if_missing(dev_music_path)

    async with engine.begin() as conn:
        from sqlalchemy import select, insert, delete
        from src.models import SubtitleStyle, MusicTrack

        # Subtitle Styles (Upsert-like logic)
        styles = [
            {
                "name": "Classic CapCut",
                "font_name": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "font_size": 70,
                "font_color": "#FFFF00",
                "stroke_color": "#000000",
                "default_words_per_line": 1
            },
            {
                "name": "Bold Impact",
                "font_name": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "font_size": 80,
                "font_color": "#FFFFFF",
                "background_color": "#000000BB",
                "default_words_per_line": 1
            },
            {
                "name": "Smooth Flow",
                "font_name": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "font_size": 60,
                "font_color": "#FFFFFF",
                "default_words_per_line": 2
            },
            {
                "name": "Neon Glow",
                "font_name": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
                "font_size": 75,
                "font_color": "#00FFFF",
                "stroke_color": "#00FFFF",
                "default_words_per_line": 1
            },
            {
                "name": "Minimal Clean",
                "font_name": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "font_size": 50,
                "font_color": "#FFFFFF",
                "default_words_per_line": 1
            }
        ]

        # Music Tracks
        raw_tracks = [
            {"name": "Breathing Shadows", "mood": "Dark, mysterious", "url": "mock://breathing_shadows"},
            {"name": "Quiet Before Storm", "mood": "Tense, building", "url": "mock://quiet_before_storm"},
            {"name": "Brilliant Symphony", "mood": "Uplifting, inspiring", "url": "mock://brilliant_symphony"},
            {"name": "Tension Suspense", "mood": "Suspenseful, tense", "url": "mock://tension_suspense"},
            {"name": "Dark Thriller", "mood": "Thrilling, ominous", "url": "mock://dark_thriller"},
            {"name": "Spooky Piano", "mood": "Eerie, haunting", "url": "mock://spooky_piano"}
        ]

        tracks = []
        for t in raw_tracks:
            if app_env == "dev":
                t["url"] = dev_music_path
            tracks.append(t)

        for s in styles:
            res = await conn.execute(select(SubtitleStyle).where(SubtitleStyle.name == s["name"]))
            if not res.fetchone():
                await conn.execute(insert(SubtitleStyle).values(**s))
                print(f"Added style: {s['name']}")
        
        # DELETE ALL MUSIC TRACKS FIRST as requested
        await conn.execute(delete(MusicTrack))
        print("Deleted all existing music tracks.")
        
        for t in tracks:
            # Re-insert tracks with (potentially) updated URLs
            await conn.execute(insert(MusicTrack).values(**t))
            print(f"Added track: {t['name']} -> {t['url']}")

    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
