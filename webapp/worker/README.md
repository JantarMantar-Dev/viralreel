
# ViralReel Video Worker

This directory contains the background worker responsible for rendering videos using Remotion.

## Prerequisites

1.  **Node.js**: Ensure Node.js is installed.
2.  **Database**: Postgres database must be running (credentials in `.env`).
3.  **S3/Object Storage**: MinIO, AWS S3, or Wasabi for uploading renders.
4.  **Environment Variables**: Create a `.env` file in this directory with the following content (see `../../.env` for reference or copy strictly needed vars):

    ```env
    DATABASE_URL=postgres://user:password@localhost:5432/viralreel
    
    # S3 / MinIO Configuration
    S3_ENDPOINT_URL=http://localhost:9000
    S3_REGION=us-east-1
    S3_ACCESS_KEY_ID=minioadmin
    S3_SECRET_ACCESS_KEY=minioadmin
    S3_BUCKET_NAME=renders
    ```

## Installation

```bash
npm install
```

## Running the Worker

The worker polls the database for jobs with status `QUEUED`.

### Development via TSX (No build needed)

```bash
npm start
```

### Production Build

```bash
npm run build
node dist/index.js
```

## Triggering a Test Job

To insert a test job into the database and see the worker pick it up:

1.  Start the worker in one terminal:
    ```bash
    npm start
    ```

2.  In a **separate terminal**, run the test insertion script:
    ```bash
    npx tsx insert_test_job.ts
    ```

    This script will:
    - Create a test user (if not exists).
    - Create a video entry.
    - Create a `render_job` in `QUEUED` status.

3.  Watch the worker terminal. You should see:
    - "Processing Job ID..."
    - "Bundling..."
    - "Rendering..."
    - "Uploading..."
    - "Job ... failed/completed"

## Architecture

-   **Entry Point**: `src/index.ts` (Worker loop polling DB)
-   **Composition**: `src/remotion/Composition.tsx` (Video layout)
-   **Schema**: `src/db/schema.ts` (Drizzle ORM definitions)
