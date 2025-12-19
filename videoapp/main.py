import os
import sys

# Ensure src is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

# Import the app object for uvicorn
from src.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
