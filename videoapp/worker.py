import asyncio
import os
import sys

# Ensure src is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from src.worker import main

if __name__ == "__main__":
    asyncio.run(main())
