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
  
  // Phase 3: Visuals
  visualStyle: string,
  segments: VisualSegment[],
  
  // Existing fields in metadata still apply (voiceId, subtitleStyleId, etc.)
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
| `render_job` | Reuse for final video rendering job queue |
| `content_niche` | Niche selection |
| `tts_voice` | Voice selection |
| `subtitle_style` | Subtitle style selection |

### 1.6 Video Status Flow for Editor Mode

Use existing `video.status` values with editor-appropriate flow:

```
DRAFT → (user editing phases) → RENDERING → COMPLETED/FAILED
```

- `DRAFT`: Video is being edited in Editor Mode (phases 1-5)
- `RENDERING`: Final render submitted via render_job
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
| POST | `/api/editor/audio/generate` | Generate TTS audio |
| GET | `/api/editor/audio/:videoId` | Get signed URL for audio playback |

**POST `/api/editor/audio/generate`**
- Input: `videoId`, `script`, `voiceId`, optional `tonePrompt`
- Process: Generate TTS → Upload to S3 → Update video metadata → Return signed URL
- Returns: `audioKey`, `audioUrl` (signed), `durationSeconds`
- Updates: `video.metadata.audioGenerationCount`, stores audio key in metadata

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
  3. Update video status to `RENDERING`
  4. Create `render_job` record (reuse existing job queue)
- Returns: `videoId`, `renderJobId`, `status: "QUEUED"`

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
| Final Video | 24 hours | Reuse existing video URL strategy |

### 3.3 Cleanup Policy

For abandoned drafts (videos in `DRAFT` status with `mode = 'editor'`):
- Query videos where `updated_at` is older than threshold (e.g., 30 days)
- Delete corresponding S3 folder
- Either delete video record or mark as expired
- Implement as cron job or scheduled task

---

## 4. Client State Management

### 4.1 EditorModeRequest Type

Client-side state mirrors the video metadata structure:

**Required Fields**:
- Video: `videoId`, `currentPhase`
- Phase 1 (Script): `nicheId`, `nicheName`, `scriptIdea`, `episodeTitle`, `duration`, `approvedScript`, `scriptGenerationCount`
- Phase 2 (Audio): `voiceId`, `voiceName`, `audioUrl`, `audioKey`, `tonePrompt`, `audioGenerationCount`
- Phase 3 (Visuals): `visualStyle`, `segments[]`
- Phase 4 (Subtitles): `subtitleStyleId`, `subtitleStyleName`
- Phase 5 (Review): `aspectRatio`, `isDraft`

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
| `audio-step` | Voice selection, audio player, tone prompt, regenerate option |
| `visuals-step` | Gallery strip, segment cards, individual/bulk regeneration |
| `subtitles-step` | Style gallery, live preview of selected style |
| `review-step` | Summary of all sections, stats, render button |

### 5.3 Hooks Architecture

Create API hooks for each phase:

- **Video**: `useEditorVideo`, `useCreateEditorVideo`, `useUpdateVideoMetadata`
- **Script**: Reuse existing script generation hooks
- **Audio**: `useGenerateAudio`, `useAudioUrl`
- **Visuals**: `useAnalyzeVisuals`, `useGenerateSegmentImage`, `useGenerateAllImages`
- **Render**: `useSubmitRender`

---

## 6. Migration Checklist

### Database
- [ ] Add `mode` column to `video` table (default: `'auto'`)
- [ ] Create and run migration file
- [ ] Update Drizzle schema with new column
- [ ] Implement cleanup job for abandoned editor drafts

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
| `/api/editor/audio/generate` | POST | 2 | Generate TTS |
| `/api/editor/audio/:videoId` | GET | 2 | Get audio URL |
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
