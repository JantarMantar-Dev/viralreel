import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.components.google import GeminiTTSProvider

async def test_gemini_tts():
    print("Testing Gemini TTS...")
    provider = GeminiTTSProvider()
    
    output_path = "test_gemini_out.wav"
    if os.path.exists(output_path):
        os.remove(output_path)
        
    text = "Hello, this is a test of the Gemini TTS system. Have a wonderful day!"
    duration = await provider.generate_audio(text, voice_id="Kore", output_path=output_path)
    
    print(f"Generated audio to {output_path}")
    print(f"Estimated duration: {duration}s")
    
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print("Success: File exists and is not empty.")
    else:
        print("Failure: File was not created or is empty.")

if __name__ == "__main__":
    asyncio.run(test_gemini_tts())
