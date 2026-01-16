# Phase 05: Backend Architecture for Editor Mode

This document outlines the backend requirements for Editor Mode. The key strategy is to **reuse existing tables** with minimal schema changes, leveraging the `metadata` JSONB column for flexibility.

---

## Table of Contents

1. [Database Strategy](#1-database-strategy)
2. [API Endpoints](#2-api-endpoints)
3. [S3 Storage Strategy](#3-s3-storage-strategy)
4. [Client State Management](#4-client-state-management)
5. [Component Architecture](#5-component-architecture)
6. [Migration Checklist](#6-migration-checklist)

---

## 1. Database Strategy

### 1.1 Core Principle: Minimal Schema Changes

**Avoid creating new tables for each feature expansion.** Instead:
- Add a `mode` column to the `video` table to distinguish workflow types
- Use the existing `metadata` JSONB column to store mode-specific data
- This approach allows future features without schema migrations

### 1.2 Video Table Modifications

**Add single column to `video` table**:

| Column | Type | Description |
|--------|------|-------------|
| `mode` | TEXT | Workflow type: `auto`, `editor` (default: `auto`) |

### 1.3 Metadata JSONB Structure for Editor Mode

When `mode = 'editor'`, the `video.metadata` column stores all editor-specific state:

```
metadata: {
  editorMode: true,
  currentPhase: "script" | "audio" | "visuals" | "subtitles" | "review",
  
  // Phase 1: Script
  scriptIdea: string,
  approvedScript: { story, wordCount, estimatedDurationSeconds },
  scriptGenerationCount: number,
  
  // Phase 2: Audio
  tonePrompt: string,
  audioGenerationCount: number,
  audioKey: string,                    // Currently selected audio S3 key
  audioDurationSeconds: number,
  selectedAudioId: string,             // ID of currently selected audio version
  audioVersions: AudioVersion[],       // All generated audio versions
  subtitles: SubtitleWord[],           // Subtitles for selected audio (if transcribed)
  
  // Phase 3: Visuals
  visualStyle: string,
  segments: VisualSegment[],
  
  // Existing fields in metadata still apply (voiceId, subtitleStyleId, etc.)
}

// AudioVersion structure
AudioVersion: {
  id: string,
  audioKey: string,
  durationSeconds: number,
  voiceId: string,
  voiceName: string,
  tonePrompt?: string,
  subtitles?: SubtitleWord[],          // Optional - generated separately
  segments?: ScriptSegment[],          // Optional - generated separately
  generatedAt: string
}

// SubtitleWord structure
SubtitleWord: {
  text: string,
  start: number,                       // frames at 30fps
  end: number                          // frames at 30fps
}

// ScriptSegment structure
ScriptSegment: {
  dialogue: string,
  start: number,                       // frames at 30fps
  end: number,                         // frames at 30fps
  duration: number                     // seconds
}
```

### 1.4 VisualSegment Structure (within metadata.segments)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID for the segment |
| `index` | number | Order in sequence (0-based) |
| `timeRange` | [number, number] | Start/end time in seconds |
| `subtitleText` | string | Text displayed during this segment |
| `imagePrompt` | string | AI prompt for image generation |
| `imageKey` | string (optional) | S3 key for generated image |
| `generatedAt` | string (optional) | ISO timestamp of generation |

### 1.5 Reusing Existing Tables

| Table | Usage for Editor Mode |
|-------|----------------------|
| `video` | Main record - add `mode` column, store editor state in `metadata` |
| `script` | Store approved script content (same as auto mode) |
| `render_job` | Reuse for final video rendering job queue (status: `VIDEO_QUEUED` / `AI_ASSET_GEN_COMPLETED` → `VIDEO_PROCESSING` → `VIDEO_COMPLETED`) |
| `content_niche` | Niche selection |
| `tts_voice` | Voice selection |
| `subtitle_style` | Subtitle style selection |

### 1.6 Video Status Flow for Editor Mode

Use existing `video.status` values with editor-appropriate flow:

```
DRAFT → (user editing phases) → GENERATING → COMPLETED/FAILED
```

- `DRAFT`: Video is being edited in Editor Mode (phases 1-5)
- `GENERATING`: Final render submitted via render_job
- `COMPLETED`: Render finished successfully
- `FAILED`: Render encountered an error

---

## 2. API Endpoints

### 2.1 Video Management (Editor Mode)

**Reuse existing video endpoints with mode awareness**:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/videos` | Create new video (include `mode: 'editor'`) |
| GET | `/api/videos/:id` | Get video data including metadata |
| PATCH | `/api/videos/:id` | Update video metadata (save progress) |
| DELETE | `/api/videos/:id` | Delete video |

**Creating Editor Mode Video**:
- Include `mode: 'editor'` in request body
- Initialize `metadata.currentPhase` to `'script'`
- Set `status` to `'DRAFT'`

**Updating Editor Mode Video**:
- Patch `metadata` with phase-specific updates
- Automatically update `updated_at` timestamp

### 2.2 Phase 1: Script API

**Reuse existing `/api/scripting/*` routes** - no new endpoints needed.

The existing script generation infrastructure handles:
- Script generation from idea
- Script regeneration with feedback
- Niche-based prompt customization

### 2.3 Phase 2: Audio API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/editor/audio/generate` | Generate TTS audio (without transcription) |
| GET | `/api/editor/audio/:videoId` | Get signed URL for audio playback |
| POST | `/api/editor/audio/transcribe` | Generate transcription for selected audio |
| POST | `/api/editor/audio/save-transcription` | Save edited transcription |
| POST | `/api/editor/audio/segment` | Generate segments from transcription |
| POST | `/api/editor/audio/save-segments` | Save edited segments |

**POST `/api/editor/audio/generate`**
- Input: `videoId`, `script`, `voiceId`, optional `tonePrompt`
- Process: Generate TTS → Upload to S3 → Update video metadata
- Returns: `audioId`, `audioKey`, `audioUrl` (signed), `durationSeconds`, `audioVersions`
- Updates: `video.metadata.audioGenerationCount`, stores audio key in metadata
- **Note**: Transcription is NOT generated here - it's a separate step for better control

**POST `/api/editor/audio/transcribe`**
- Input: `videoId`, `audioId`
- Process: Download audio from S3 → Call Groq Whisper → Update audio version with subtitles
- Returns: `audioId`, `subtitles[]`, `wordCount`
- Updates: `video.metadata.audioVersions[].subtitles`, `video.metadata.subtitles` (if selected)
- **Error Handling**: Returns user-friendly errors (e.g., "Transcription failed. Please try again.")

**POST `/api/editor/audio/save-transcription`**
- Input: `videoId`, `audioId`, `subtitles[]`
- Process: Validate user owns video → Update audio version subtitles → Update main subtitles if selected
- Returns: `audioId`, `wordCount`
- **Use Case**: User edits transcription words in the UI to fix errors

**POST `/api/editor/audio/segment`**
- Input: `videoId`, `audioId`
- Process: Use Gemini LLM to analyze transcription → Group words into scenes → Align timestamps
- Returns: `audioId`, `segments[]`, `segmentCount`
- Updates: `video.metadata.audioVersions[].segments`, `video.metadata.scriptSegments` (if selected)
- **Dependency**: Requires transcription to be completed first

**POST `/api/editor/audio/save-segments`**
- Input: `videoId`, `audioId`, `segments[]`
- Process: Save user-edited segments to metadata
- Returns: `audioId`, `segmentCount`

**Integration Details (Server-Side):**
- **TTS Provider**: Uses `CustomGeminiTTS` with `gemini-2.5-flash-preview-tts` (or user-configured model).
- **Subtitles/Transcription** (Separate Step):
    - **Provider**: **Groq**
    - **Model**: `whisper-large-v3-turbo`
    - **Logic**: Post-processing of generated audio to extract word-level timestamps using `groq.audio.transcriptions.create`.
    - **Why**: Decoupled from audio generation for better error handling and user control.
    - **Environment Variable**: `GROQ_TTS_KEY` or `GROQ_API_KEY`
- **Segmentation** (Separate Step):
    - **Provider**: **Google Generative AI** (Gemini)
    - **Model**: `gemini-3-flash-preview`
    - **Logic**: LLM-based grouping of words into coherent narrative segments.

**Audio Versioning:**
- Multiple audio versions are stored in `metadata.audioVersions[]`
- Each version has: `id`, `audioKey`, `durationSeconds`, `voiceId`, `voiceName`, `tonePrompt`, `subtitles?`, `segments?`, `generatedAt`
- `metadata.selectedAudioId` tracks the currently selected version
- Subtitles are optional per version - only generated when user clicks "Get Transcription"
- Segments are optional per version - only generated when user clicks "Segment" after transcription

### 2.4 Phase 3: Visuals API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/editor/visuals/analyze` | Analyze script → generate segments |
| POST | `/api/editor/visuals/generate-segment` | Generate image for one segment |
| POST | `/api/editor/visuals/generate-all` | Generate images for all segments |
| PATCH | `/api/editor/visuals/segment/:segmentId` | Update segment prompt |

**POST `/api/editor/visuals/analyze`**
- Input: `videoId`, `script`, `audioDurationSeconds`
- Process: Split script into sentences → Calculate time per segment → Generate visual prompts using LLM
- Returns: Array of `VisualSegment` objects with auto-generated image prompts
- Updates: `video.metadata.segments`

**POST `/api/editor/visuals/generate-segment`**
- Input: `videoId`, `segmentId`, `prompt`, optional `style`
- Process: Generate image → Upload to S3 → Update segment in video metadata
- Returns: `segmentId`, `imageKey`, `imageUrl` (signed)

**Integration Details (Server-Side):**
- **Image Provider**: **Google Generative AI** (Gemini)
- **Model**: `gemini-3-pro-image-preview`
- **Logic**:
    - Accepts `prompt` and `aspectRatio` (mapped to `9:16`, `16:9`, `1:1`).
    - Applies visual style via prompt injection (e.g., "Style: Bold comic-book style...").
    - Uses `generateContent` endpoint with `response_mime_type: image/jpeg` (or inline data handling).
- **Styles Reference**:
    - `comic`: "Bold comic-book style, thick outlines"
    - `anime`: "Clean anime style, sharp linework"
    - `realism`: "Ultra-realistic photographic style"
    - (and others defined in `IMAGE_STYLES`)

**POST `/api/editor/visuals/generate-all`**
- Input: `videoId`, optional `style`
- Process: Generate images for all segments
- Returns: Array of `{ segmentId, imageKey, imageUrl }`

### 2.5 Phase 5: Render API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/editor/render` | Submit video for final render |

**POST `/api/editor/render`**
- Input: `videoId`
- Process:
  1. Validate all phases are complete in metadata
  2. Check and deduct user credits
  3. Update video status to `GENERATING`
  4. Create `render_job` record (reuse existing job queue) with status `VIDEO_QUEUED`
- Returns: `videoId`, `renderJobId`, `status: "VIDEO_QUEUED"`

### 2.6 Test Coverage (API & Services)

**Unit Tests**:
*   `services/editor-audio-service.test.ts`: 
    - Mock `Groq` and `GoogleGenerativeAI` responses. 
    - Verify correct metadata updates on success. 
    - Test error handling (e.g., quota exceeded, missing API key).
    - Test decoupled audio generation (no transcription).
    - Test transcription generation separately.
    - Test transcription save functionality.
*   `services/editor-visual-service.test.ts`: Mock image generation. Verify prompt injection logic (style appending). Test segment splitting logic (script alignment).
*   `api/editor-render.test.ts`: Test validation logic (ensure all phases complete). Verify credit deduction. Check `render_job` creation parameters.

**Integration Tests**:
*   `tests/integration/audio-flow.test.ts`: 
    - Call `/api/editor/audio/generate` with mock S3. 
    - Verify signed URL generation and database updates.
    - Call `/api/editor/audio/transcribe` and verify subtitles generated.
    - Call `/api/editor/audio/save-transcription` with edited subtitles.
*   `tests/integration/visuals-flow.test.ts`: Call `/api/editor/visuals/analyze`. Verify return structure of segments. Call `/api/editor/visuals/generate-segment`. Verify metadata update.
*   `tests/integration/renderer-queue.test.ts`: Submit render job. Verify it appears in the queue with correct status.

---

## 3. S3 Storage Strategy

### 3.1 Key Structure

Editor mode assets follow the existing video-centric path pattern:

```
{bucket}/
├── videos/                           # All video assets
│   └── {userId}/
│       └── {videoId}/
│           ├── audio.wav             # TTS audio file
│           ├── images/
│           │   ├── {segmentId-1}.png
│           │   ├── {segmentId-2}.png
│           │   └── ...
│           ├── original.mp4          # Final rendered video
│           ├── compressed.mp4
│           └── thumbnail.jpg
```

### 3.2 Signed URL Strategy

| Asset Type | TTL | Notes |
|------------|-----|-------|
| Editor Audio | 3 hours | Generate on-demand |
| Editor Images | 3 hours | Generate on-demand |
| Final Video | 3 hours | Consistency with other assets |



---

## 4. Client State Management

### 4.1 EditorModeRequest Type

Client-side state mirrors the video metadata structure:

**Required Fields**:
- Video: `videoId`, `currentPhase`
- Phase 1 (Script): `nicheId`, `nicheName`, `scriptIdea`, `episodeTitle`, `duration`, `approvedScript`, `scriptGenerationCount`
- Phase 2 (Audio): `voiceId`, `voiceName`, `audioUrl`, `audioKey`, `tonePrompt`, `audioGenerationCount`, `audioVersions[]`, `selectedAudioId`, `subtitles[]`, `scriptSegments[]`
- Phase 3 (Visuals): `visualStyle`, `segments[]`
- Phase 4 (Subtitles): `subtitleStyleId`, `subtitleStyleName`
- Phase 5 (Review): `aspectRatio`, `isDraft`

**AudioVersion Type**:
- `id`, `audioKey`, `audioUrl`, `durationSeconds`, `voiceId`, `voiceName`, `tonePrompt?`, `subtitles?`, `segments?`, `generatedAt`

**SubtitleWord Type**:
- `text`, `start` (frames at 30fps), `end` (frames at 30fps)

**ScriptSegment Type**:
- `dialogue`, `start` (frames at 30fps), `end` (frames at 30fps), `duration` (seconds)

### 4.2 Auto-Save Strategy

Implement debounced auto-save to persist progress:
- Debounce interval: ~2 seconds after changes
- Periodic save: every 30 seconds if changes exist
- Save triggers: phase transitions, significant data changes
- Uses the `PATCH /api/videos/:id` endpoint to update metadata

---

## 5. Component Architecture

### 5.1 Shared Components

Create reusable components for the editor workflow:

| Component | Purpose |
|-----------|---------|
| `AudioPreviewPlayer` | Audio playback with progress bar and time display |
| `SegmentCard` | Display segment with time range, subtitle, prompt, and image preview |
| `ImageGalleryStrip` | Horizontal thumbnails with hover/click preview |
| `StyleGallery` | Grid of selectable style options |
| `ReviewSection` | Collapsible section with edit link |
| `QuickStats` | Display duration, segment count, word count |
| `RegenerateButton` | Button with loading state and attempt counter |

### 5.2 Step Components

Each phase should have a dedicated step component:

| Step | Purpose |
|------|---------|
| `script-step` | Title input, idea input, duration selector, generate/preview script |
| `audio-step` | Voice selection, tone prompt, audio versioning, transcription generation, transcription editor |
| `visuals-step` | Gallery strip, segment cards, individual/bulk regeneration |
| `subtitles-step` | Style gallery, live preview of selected style |
| `review-step` | Summary of all sections, stats, render button |

### 5.3 Hooks Architecture

Create API hooks for each phase:

- **Video**: `useEditorVideo`, `useCreateEditorVideo`, `useUpdateVideoMetadata`
- **Script**: Reuse existing script generation hooks
- **Audio**: `useGenerateAudio`, `useGenerateTranscription`, `useSaveTranscription`, `useAudioUrl`
- **Visuals**: `useAnalyzeVisuals`, `useGenerateSegmentImage`, `useGenerateAllImages`
- **Render**: `useSubmitRender`

---

## 6. Migration Checklist

### Database
- [ ] Add `mode` column to `video` table (default: `'auto'`)
- [ ] Create and run migration file
- [ ] Update Drizzle schema with new column


### Server API Routes
- [ ] Update existing video routes to handle `mode` parameter
- [ ] Create `api/editor-audio.ts` - TTS generation endpoints
- [ ] Create `api/editor-visuals.ts` - Image generation endpoints
- [ ] Create `api/editor-render.ts` - Final render submission
- [ ] Register new routes in server index

### Server Services
- [ ] Create `services/editor-audio-service.ts` - TTS integration
- [ ] Create `services/editor-visual-service.ts` - Image generation logic
- [ ] Update existing video service to handle editor mode metadata

### Client Components
- [ ] Create `editor/context/editor-creation-context.tsx`
- [ ] Create `editor/layout.tsx` with phase navigation
- [ ] Create all step components (5)
- [ ] Create all shared components (7)

### Client Hooks
- [ ] Create `hooks/useEditorVideo.ts`
- [ ] Create `hooks/useAudioGeneration.ts`
- [ ] Create `hooks/useImageGeneration.ts`
- [ ] Create `hooks/useRender.ts`

---

## 7. Summary Tables

### Schema Changes

| Table | Change | Description |
|-------|--------|-------------|
| `video` | Add column | `mode TEXT DEFAULT 'auto'` |
| `video.metadata` | Extend | Add editor-specific fields to existing JSONB |

### New API Endpoints

| Endpoint | Method | Phase | Purpose |
|----------|--------|-------|---------|
| `/api/editor/audio/generate` | POST | 2 | Generate TTS audio |
| `/api/editor/audio/:videoId` | GET | 2 | Get audio URL |
| `/api/editor/audio/transcribe` | POST | 2 | Generate transcription for audio |
| `/api/editor/audio/save-transcription` | POST | 2 | Save edited transcription |
| `/api/editor/visuals/analyze` | POST | 3 | Script → Segments |
| `/api/editor/visuals/generate-segment` | POST | 3 | Generate 1 image |
| `/api/editor/visuals/generate-all` | POST | 3 | Generate all images |
| `/api/editor/render` | POST | 5 | Submit for render |

### Files to Create

| File | Type | Purpose |
|------|------|---------|
| `db/migrations/XXXX_add_video_mode.sql` | Migration | Add mode column |
| `api/editor-audio.ts` | Route | Audio generation |
| `api/editor-visuals.ts` | Route | Visual generation |
| `api/editor-render.ts` | Route | Render submission |
| `services/editor-audio-service.ts` | Service | TTS logic |
| `services/editor-visual-service.ts` | Service | Image generation logic |
