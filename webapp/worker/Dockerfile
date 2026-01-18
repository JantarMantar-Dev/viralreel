# Base stage for system dependencies
FROM node:20-bookworm-slim AS base

# Install system dependencies required for Chrome Headless Shell and FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
    curl \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage - install npm packages and chrome-headless-shell
FROM base AS dependencies
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Install chrome-headless-shell using Puppeteer's browser installer
# This downloads the exact version Remotion needs
RUN npx @puppeteer/browsers install chrome-headless-shell@stable \
    --install-deps \
    --path /app/.cache/puppeteer

# Find the chrome path and write it to a file for the next stage
RUN find /app/.cache/puppeteer -name "chrome-headless-shell" -type f -executable 2>/dev/null | head -1 > /app/.chrome-path

# Production stage
FROM base AS production

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
# Copy chrome-headless-shell installation
COPY --from=dependencies /app/.cache/puppeteer /app/.cache/puppeteer
# Copy the chrome path file
COPY --from=dependencies /app/.chrome-path /app/.chrome-path
COPY package*.json ./

# Copy source code and scripts
COPY . .

# Environment Variables
ENV NODE_ENV=production
# Prevent any browser downloads at runtime
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV REMOTION_SKIP_BROWSER_DOWNLOAD=true

# Read the chrome path and set it as ENV
# Note: We need to use a workaround since Docker doesn't support dynamic ENV from file
# We'll write the path to /etc/environment and source it
RUN CHROME_PATH=$(cat /app/.chrome-path) && \
    echo "Found Chrome at: $CHROME_PATH" && \
    chmod +x "$CHROME_PATH" && \
    # Write to multiple locations for maximum compatibility
    echo "CHROME_EXECUTABLE_PATH=$CHROME_PATH" >> /etc/environment && \
    echo "PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> /etc/environment && \
    # Also create a profile script
    echo "export CHROME_EXECUTABLE_PATH=$CHROME_PATH" > /etc/profile.d/chrome.sh && \
    echo "export PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> /etc/profile.d/chrome.sh && \
    chmod +x /etc/profile.d/chrome.sh

# Since Docker ENV can't be dynamic, we hardcode the known path pattern
# The chrome-headless-shell is always installed to this structure by @puppeteer/browsers
# For linux arm64 (bookworm): /app/.cache/puppeteer/chrome-headless-shell/linux_arm-<version>/chrome-headless-shell-linux64/chrome-headless-shell
# For linux x64: /app/.cache/puppeteer/chrome-headless-shell/linux-<version>/chrome-headless-shell-linux64/chrome-headless-shell
# We use a glob-like approach via the entrypoint

# Create entrypoint that sets the path dynamically
RUN echo '#!/bin/bash\n\
CHROME_PATH=$(cat /app/.chrome-path 2>/dev/null || find /app/.cache/puppeteer -name "chrome-headless-shell" -type f -executable 2>/dev/null | head -1)\n\
if [ -n "$CHROME_PATH" ]; then\n\
    export CHROME_EXECUTABLE_PATH="$CHROME_PATH"\n\
    export PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"\n\
fi\n\
exec "$@"' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ARG VIDEO_WORK_DIR=/app/work_dir
ENV VIDEO_WORK_DIR=$VIDEO_WORK_DIR

# Database
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# S3 Configuration
ARG S3_ENDPOINT_URL
ENV S3_ENDPOINT_URL=$S3_ENDPOINT_URL

ARG S3_REGION
ENV S3_REGION=$S3_REGION

ARG S3_ACCESS_KEY_ID
ENV S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID

ARG S3_SECRET_ACCESS_KEY
ENV S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY

ARG S3_BUCKET_NAME
ENV S3_BUCKET_NAME=$S3_BUCKET_NAME

# AI API Keys
ARG GOOGLE_API_KEY
ENV GOOGLE_API_KEY=$GOOGLE_API_KEY

ARG GOOGLE_SCRIPT_MODEL
ENV GOOGLE_SCRIPT_MODEL=$GOOGLE_SCRIPT_MODEL

ARG GOOGLE_TTS_MODEL
ENV GOOGLE_TTS_MODEL=$GOOGLE_TTS_MODEL

ARG GOOGLE_IMAGE_MODEL
ENV GOOGLE_IMAGE_MODEL=$GOOGLE_IMAGE_MODEL

ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

ARG GROQ_API_KEY
ENV GROQ_API_KEY=$GROQ_API_KEY

# Ensure work directory exists
RUN mkdir -p $VIDEO_WORK_DIR
VOLUME $VIDEO_WORK_DIR

# Use the wrapper script as entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
