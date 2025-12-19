import asyncio
import os
import sys

# Ensure src is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from src.worker import main
from seed_data import seed

async def run_worker():
    # Run seeding before starting worker
    await seed()
    # Start worker polling
    await main()

if __name__ == "__main__":
    asyncio.run(run_worker())
