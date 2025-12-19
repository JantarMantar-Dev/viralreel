import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

try:
    print("Listing Models...")
    for m in client.models.list():
        # Inspect available attributes if needed, but usually .name exists
        # In v1beta/v1, it might be unique_id or similar?
        # Let's just print the model object repr to be safe
        print(f"Model: {m.name}")
        # Try to print supported methods if available
        # print(f"Methods: {getattr(m, 'supported_generation_methods', 'Unknown')}")
except Exception as e:
    print(f"Error: {e}")
