# Phase 06: Integrated Editor Mode Implementation

This plan merges the requirements from "Phase 04: Editor Mode Implementation" (Frontend) and "Phase 05: Backend Architecture" into a single, unified execution strategy. It adopts a **vertical slice** approach, where we build the backend and frontend for each phase together before moving to the next.

---

## Phase 6.1: Foundation & Infrastructure

**Objective**: Establish the database schema, shared components, and basic routing structure needed for Editor Mode.

### 6.1.1 Database Migration
- [x] Create generic `mode` column migration for `video` table (`text`, default: `'auto'`).
- [x] Update Drizzle schema (`server/src/db/schema.ts`) to include the new column.
- [x] Update `Video` type definition to include `mode`.

### 6.1.2 Shared Frontend Architecture
- [ ] Create `webapp/client/src/pages/dashboard/shared` folder structure.
- [x] Create `webapp/client/src/pages/dashboard/editor/context/editor-creation-context.tsx` (mirroring `EditorModeRequest` type).
- [x] Create `webapp/client/src/pages/dashboard/editor/layout.tsx` with the 5-step navigation (Script -> Audio -> Visuals -> Subtitles -> Review).
- [x] Update `webapp/client/src/App.tsx` (or routing config) to include `/editor/*` routes.
- [ ] Update Entry Points (`onboarding-empty-state.tsx`, `videos/page.tsx`) to link to Editor Mode.

### 6.1.3 Backend Service Updates
- [x] Update `video-service.ts` to handle `mode: 'editor'` during creation.
- [x] Ensure `metadata` JSONB column is correctly typed/validated for Editor Mode.

---

## Phase 6.2: Script Phase (Vertical Slice)

**Objective**: Migrate existing script generation logic into the Editor Mode structure.

### 6.2.1 Frontend Implementation
- [x] Create `editor/steps/script-step.tsx`.
- [x] **Reuse**: Integrate existing Idea Input, Duration Selector, and Episode Title components.
- [x] **Reuse**: Integrate existing Script Generation API hooks (`useGenerateScript`).
- [x] **State**: Connect script approval and generation count to `EditorCreationContext`.
- [x] **Auto-Save**: Implement debounced `PATCH /api/videos/:id` call when script changes.

### 6.2.2 Backend Verification
- [x] Verify existing `/api/scripting/*` endpoints work seamlessly with the new `editor` mode video objects.
- [x] Ensure approved script is stored in both `script` table (legacy) and `video.metadata` (editor state).

---

## Phase 6.3: Audio Phase (Vertical Slice)

**Objective**: Implement Text-to-Speech generation with tone control, decoupled transcription, and transcription editing.

### 6.3.1 Backend Implementation
- [x] **New Endpoint**: `POST /api/editor/audio/generate`.
    - Input: `videoId`, `script`, `voiceId`, `tonePrompt`.
    - Logic: Call Gemini TTS → Upload S3 → Update Metadata (NO transcription here).
    - Returns: `audioId`, `audioKey`, `audioUrl`, `durationSeconds`, `audioVersions`.
- [x] **New Endpoint**: `POST /api/editor/audio/transcribe`.
    - Input: `videoId`, `audioId`.
    - Logic: Download audio from S3 → Call Groq Whisper → Update audio version with subtitles.
    - Returns: `audioId`, `subtitles[]`, `wordCount`.
- [x] **New Endpoint**: `POST /api/editor/audio/save-transcription`.
    - Input: `videoId`, `audioId`, `subtitles[]`.
    - Logic: Save user-edited transcription to metadata.
    - Returns: `audioId`, `wordCount`.
- [x] **New Endpoint**: `POST /api/editor/audio/segment`.
    - Input: `videoId`, `audioId`.
    - Logic: Call Gemini Segmenter (LLM) using subtitles → Align timestamps → Update metadata.
    - Returns: `audioId`, `segments[]`, `segmentCount`.
- [x] **New Endpoint**: `POST /api/editor/audio/save-segments`.
    - Input: `videoId`, `audioId`, `segments[]`.
    - Logic: Save user-edited segments to metadata.
    - Returns: `audioId`, `segmentCount`.
- [x] **Service**: `services/editor-audio-service.ts`.
    - Integration with `CustomGeminiTTS` (gemini-2.5-flash-preview-tts).
    - Integration with `Groq` for `whisper-large-v3-turbo`.
    - Integration with `Gemini` for segmentation (`gemini-3-flash-preview`).
    - `generateAudio()` - TTS only, no transcription.
    - `generateTranscription()` - Separate transcription step.
    - `saveTranscription()` - Save edited transcription.
    - `generateSegments()` - Separate segmentation step after transcription.
    - `saveSegments()` - Save edited segments.
- [x] **Storage**: Define S3 path structure for audio assets (`videos/{userId}/{videoId}/audio_{audioId}.wav`).
- [x] **Storage**: Add `downloadFile()` method to storage provider for transcription.

### 6.3.2 Frontend Implementation
- [x] Create `editor/steps/audio-step.tsx`.
- [x] **UI Components**:
    - `VoiceSelection`: Grid of selectable voices with preview.
    - `ToneInput`: Text field for style/tone prompt.
    - `AudioVersionsList`: Display all generated versions with play/select controls.
    - `TranscriptionStatus`: Badge showing "Transcribed" or "No transcription".
    - `SegmentationStatus`: Badge showing "Segmented".
    - `GetTranscriptionButton`: Trigger transcription for selected audio.
    - `SegmentButton`: Trigger segmentation for selected audio (after transcription).
    - `TranscriptionEditor`: Editable word list with save functionality.
    - `SegmentationViewer`: Editable list of segments with dialogue.
    - `RegenerateButton`: Generate new audio version.
- [x] **Integration**: 
    - Connect to `POST /api/editor/audio/generate` for audio generation.
    - Connect to `POST /api/editor/audio/transcribe` for transcription.
    - Connect to `POST /api/editor/audio/save-transcription` for saving transcription edits.
    - Connect to `POST /api/editor/audio/segment` for segmentation.
    - Connect to `POST /api/editor/audio/save-segments` for saving segment edits.
- [x] **State**: 
    - Store `audioUrl`, `audioKey`, `audioVersions[]`, `selectedAudioId` in context.
    - Track transcription editing state and unsaved changes.
    - Track segmentation editing state and unsaved changes.
- [x] **Navigation Control**:
    - Block "Continue" button until selected audio has transcription AND segments.
    - Auto-save edited transcription and segments on "Continue" if unsaved changes exist.
- [x] **Error Handling**:
    - Display user-friendly transcription errors with retry option.
    - Display user-friendly segmentation errors with retry option.
    - Show "Transcription Required" and "Segmentation Required" notices when needed.

### 6.3.3 Audio/Transcription/Segmentation Flow
```
1. User selects voice and optional tone
2. User clicks "Generate Audio" → Creates audio version (no transcription)
3. User can preview and generate multiple versions
4. User selects preferred audio version
5. User clicks "Get Transcription" → Generates word-level subtitles
6. User reviews transcription, can edit words if needed
7. User clicks "Segment" → Splits script into visual scenes
8. User reviews segments, can edit dialogue if needed
9. User saves changes (or auto-saved on Continue)
10. User proceeds to Visuals step
```

---

## Phase 6.4: Visuals Phase (Vertical Slice)

**Objective**: Implement segment-based image generation with Gemini.

### 6.4.1 Backend Implementation
- [x] **New Endpoint**: `POST /api/editor/visuals/analyze`.
    - Logic: Split script by sentences/time -> Generate Prompts (LLM).
- [x] **New Endpoint**: `POST /api/editor/visuals/generate-segment`.
    - Input: `segmentId`, `prompt`, `style`.
    - Logic: Call Gemini Image Gen -> Upload S3 -> Update Metadata.
- [x] **New Endpoint**: `POST /api/editor/visuals/generate-all`.
- [x] **Service**: `services/editor-visual-service.ts`.

### 6.4.2 Frontend Implementation
- [x] Create `editor/steps/visuals-step.tsx`.
- [x] **UI Components**:
    - `ImageGalleryStrip`: Horizontal thumbnail view.
    - `SegmentCard`: Edit prompt, view segment time, regenerate image.
- [x] **Integration**:
    - Call `analyze` on first load if segments empty.
    - Call `generate-segment` for individual updates.
- [x] **State**: Manage `VisualSegment[]` in context.

---

## Phase 6.5: Subtitles Phase (Vertical Slice)

**Objective**: Implement subtitle styling and live preview.

### 6.5.1 Frontend Implementation
- [ ] Create `editor/steps/subtitles-step.tsx`.
- [ ] **UI Components**:
    - `StyleGallery`: Grid of preset styles (Fonts, Colors).
    - `LivePreview`: Overlay selected style on current visual segment (from context).
- [x] **State**: Store `subtitleStyleId` in metadata.

### 6.5.2 Backend Implementation
- [x] Ensure `subtitle_style` table is populated with presets.
- [x] Verify metadata updates persist the selected style ID.

---

## Phase 6.6: Review & Job Submission (Vertical Slice)

**Objective**: Final validation and submission to render queue.

### 6.6.1 Backend Implementation
- [x] **New Endpoint**: `POST /api/editor/render`.
    - Logic: Validate all phases -> Deduct Credits -> Create `render_job`.
- [x] **Job Queue**: Ensure `render_job` can accept `editor` mode jobs (status: `VIDEO_QUEUED`).

### 6.6.2 Frontend Implementation
- [x] Create `editor/steps/review-step.tsx`.
- [x] **UI Components**:
    - Summary Dashboard (Duration, Assets count).
    - "Edit" links jumping back to specific steps.
    - Final "Render Video" button.
- [x] **Integration**: Connect to `POST /api/editor/render`.

---

## Phase 6.7: Testing & E2E

### 6.7.1 Unit Tests
- [ ] `editor-audio-service.test.ts` (TTS, Transcription, Segmentation)
- [ ] `editor-visual-service.test.ts`
- [ ] `editor/context.test.tsx`

### 6.7.2 E2E Tests (Playwright)
- [ ] `editor-mode-flow.spec.ts`: Full walkthrough from Script to Render, including Segmentation.
- [x] Verification of state persistence (reload page test).
