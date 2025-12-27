# Video Generation Worker Architecture

## Overview
The `webapp/worker` service is a background worker responsible for rendering video content using [Remotion](https://www.remotion.dev/). It replaces the previous Python-based `videoapp` rendering pipeline.

## Responsibilities
1.  **Job Polling**: Continuously checks the `renderJob` database table for `QUEUED` jobs.
2.  **Asset Resolution**: Fetches necessary metadata (script, voiceover URLs, image URLs) required for the video.
3.  **Rendering**: Uses `@remotion/renderer` to generate an MP4 file from the React-based composition.
4.  **Upload**: Uploads the resulting media to S3/Wasabi.
5.  **Status Update**: Updates the database with the final video URL or error status.

## Directory Structure
```
webapp/worker/
├── src/
│   ├── db/                 # Database connection and schema imports
│   ├── remotion/           # Remotion React components
│   │   ├── Root.tsx        # Entry point for compositions
│   │   ├── Composition.tsx # Main video layout
│   │   └── types.ts        # Prop definitions
│   ├── index.ts            # Worker entry point (polling logic)
│   └── renderer.ts         # Wrapper around Remotion rendering
├── package.json
├── tsconfig.json
└── .env                    # Shared secrets (DB, AWS)
```

## Data Flow
1.  **Frontend/API** creates a `Video` and `RenderJob` (status: `QUEUED`).
2.  **Worker** detects the job.
3.  **Worker** gathers props:
    - `audioUrl`: From `tts_voice` logic or pre-generated file.
    - `imageUrls`: From `video_item_metadata` or `script`.
    - `subtitles`: From `script` content.
    - `musicUrl`: From `music_track`.
4.  **Remotion** renders the video frame-by-frame.
5.  **Worker** saves the output and marks the job `COMPLETED`.
