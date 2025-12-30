# Base stage for system dependencies
FROM node:20-bookworm-slim AS base

# Install system dependencies required for Remotion and FFmpeg
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set Remotion paths to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
# Install all dependencies including devDependencies (tsx is needed, remotion bundling might need dev deps)
RUN npm ci

# Production stage
FROM base AS production

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code and scripts
COPY . .

# Environment Variables
ENV NODE_ENV=production

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

# Run the worker - default to video worker, can be overridden
CMD ["npm", "start"]
