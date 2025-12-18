# Use Python 3.12 Slim base
FROM python:3.12-slim

# Install System Dependencies
# ffmpeg: Required for MoviePy
# curl: Healthchecks
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Working Directory
WORKDIR /app

# Install Python Dependency Manager (uv)
# We can use pip to install uv, or just install dependencies via pip export.
# Using standard pip for container simplicity unless we want to copy uv binary.
# Recommended: Copy requirements.txt generated from uv or use pip.
# We will assume we can generate/use requirements.txt or install via uv if we install it.
# Let's install uv to match local dev.
RUN pip install uv

# Copy Project Files
COPY pyproject.toml uv.lock ./

# Install Dependencies
# --system installs into system python, avoiding venv creation inside container
RUN uv sync --frozen --no-dev

# Copy Application Code
COPY . .

# Set Env vars
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose Port for API
EXPOSE 8000

# Default Command (Overridden by docker-compose)
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
