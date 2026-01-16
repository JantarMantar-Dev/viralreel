# Phase 04: Editor Mode Implementation

This document covers the implementation requirements for the 5-phase Editor Mode workflow. The goal is to create a seamless, linear editing experience that guides the user from script to final render.

---

## Core Objectives

1.  **Linear Progression**: Enforce a strict step-by-step flow (Script -> Audio -> Visuals -> Subtitles -> Review).
2.  **State Persistence**: Auto-save progress at every step to allow users to leave and return without losing work.
3.  **Visualization**: Provide immediate visual feedback for every action (listening to audio, seeing images, previewing subtitles).

---

## Edit Details Implementation (Data Loading)

When opening an existing video in Editor Mode, we populate the wizard steps with the following data from the video's metadata. This ensures users can resume editing exactly where they left off.

### 1. Scripting Page (`/editor/script`)
Loads the core video concept and generated script.

*   **Video Name** (`episodeTitle`): Loaded from `video.title` or `metadata.episodeTitle`.
*   **Video Idea & Context** (`scriptIdea`): Loaded from `metadata.scriptIdea`.
*   **Duration** (`duration`): Loaded from `metadata.duration`.
*   **Aspect Ratio** (`aspectRatio`): Loaded from `metadata.aspectRatio` (defaults to "portrait").
*   **Visual Format** (`visualFormat`): Loaded from `metadata.visualFormat` (defaults to "image").
*   **Image Style** (`visualStyle`): Loaded from `metadata.visualStyle`.
*   **Script Generation** (`approvedScript`): Loaded from `metadata.approvedScript` or `metadata.generatedScript`. If present, shows the approved script; otherwise shows the generation prompt.

### 2. Audio Synthesis Page (`/editor/audio`)
Loads the voice selection, tone settings, and all generated audio artifacts.

*   **Selected Voice** (`voiceId`, `voiceName`): Loaded from `metadata.voiceId` and `metadata.voiceName`.
*   **Tone Adjustment** (`tonePrompt`): Loaded from `metadata.tonePrompt`.
*   **Audio Versions** (`audioVersions`): A list of all previously generated audio takes, loaded from `video.audioVersions` (which delegates to `metadata.audioVersions`). This includes:
    *   Audio URL (signed)
    *   Duration
    *   Creation timestamp
    *   Specific voice/tone used for that version
*   **Selected Version** (`selectedAudioId`): The ID of the active audio take, loaded from `metadata.selectedAudioId`.
*   **Transcriptions** (`subtitles`): If the selected audio has been transcribed, loads `metadata.subtitles`.
*   **Segments** (`scriptSegments`): If the selected audio has been segmented for visuals, loads `metadata.scriptSegments`.

---

## Phase 4.1: Script Editor (Migration)

> [!NOTE]
> **ALREADY IMPLEMENTED**: A robust script generation and editing flow (Idea, Duration, Title input, and Feedback loop) already exists in the codebase.
> **Action**: We do NOT need to re-implement this logic. We will simply reuse the existing components and API endpoints. The requirement here is strictly migration/integration, not development.

**Objective**: Migrate the existing script generation functionality into the new Editor Mode structure.

**Key Requirements**:
*   **Unified Interface**: Integrate the "Idea Input", "Duration Selection", and "Episode Title" into a single cohesive starting step.
*   **Generation Feedback**: Maintain the existing feedback loop where users can request changes to the generated script using natural language.
**Test Coverage**:
*   **Unit Tests**:
    *   `ScriptEditor.test.tsx`: Mock API responses for `/api/scripting/generate`. Verify state updates when text is edited manually. Test error handling for API failures.
    *   `ScriptApproval.test.tsx`: Check that the "Next" button is disabled until the script is approved.
*   **E2E Tests**:
    *   `script-flow.spec.ts`: Fill out the idea form -> click Generate -> verify script appears -> edit text -> click Approve -> verify transition to next step.

## Phase 4.2: Audio Synthesis

**Objective**: Generate and refine the voiceover audio for the video.

**Key Requirements**:
*   **Full Audio Preview**: Generate the entire voiceover track based on the approved script immediately upon entering this step.
*   **Tone Control**: Provide a "Tone Prompt" input that allows users to describe the desired speaking style (e.g., "Excited and fast-paced" or "Somber and slow").
*   **Regenerate & Listen**: Allow users to regenerate the audio with new settings and listen to the result in an inline player with a waveform or progress bar.

**Test Coverage**:
*   **Unit Tests**:
    *   `AudioStep.test.tsx`: Mock audio generation API. Verify that the audio player component receives the correct URL. Test "Regenerate" button state (loading spinners).
    *   `ToneInput.test.tsx`: Verify input validation for tone prompts.
*   **E2E Tests**:
    *   `audio-generation.spec.ts`: Enter Audio step -> verify auto-generation triggers -> wait for audio to load -> play audio -> change tone -> regenerate -> verify new audio loads.

## Phase 4.3: Visuals Editor

**Objective**: Create and customize the visual imagery for each segment of the script, starting with prompt generation followed by image creation.

**Key Requirements**:
*   **Step 1: Visual Prompts Generation**:
    *   **Initial Action**: Click to generate visual prompts for all segments.
    *   **Segment Display**: Display segments with a distinct section for the "Visual Prompt".
    *   **Locked Structure**: Time segments and script text are locked (read-only) in this phase to prevent structural desync.
    *   **Regenerate All Prompts**: Option to regenerate prompts for all sections.
        *   **Confirmation Dialog**: Must trigger a modal asking "Are you sure you want to regenerate? You will lose all current visual prompts."
    *   **Manual Editing**: Users can edit individual visual prompt and save them by manually clicking save button.
*   **Step 2: Image Generation**:
    *   **Generate All**: Once prompts are generated, provide an option to "Generate All Images".
    *   **Image Display**: Update each segment to show the generated image on the right side.
    *   **Image Controls**:
        *   **Regenerate**: Button to regenerate just that specific image.
        *   **Expand**: Button to open the image in a large dialog for detailed viewing.
*   **Gallery View**: Show a "filmstrip" or grid view of all generated images to ensure visual consistency across the video.

**Test Coverage**:
*   **Unit Tests**:
    *   **Prompt Logic**: Verify that clicking "Regenerate All Prompts" opens the confirmation dialog. Test manual edits to prompt text are saved to state.
    *   **Image Logic**: Verify "Generate All Images" triggers the correct batch API call. Test "Expand" button opens the modal with correct image source.
*   **E2E Tests**:
    *   **Full Visuals Workflow**: Generate Prompts -> Edit a prompt -> Confirm "Regenerate All" warning -> Generate All Images -> Verify images appear in segments -> Expand an image for view.

## Phase 4.4: Subtitles Editor

**Objective**: Style and overlay captions on the video.

**Key Requirements**:
*   **Style Presets**: Offer a curated list of subtitle styles (e.g., "Karaoke", "Minimalist", "Bold") rather than overwhelming configuration options.
*   **Live Preview**: Render a real-time preview of the selected subtitle style over the current visual segment, showing font, color, and animation behavior.
*   **Global Application**: Apply the selected style universally to the entire video track.

**Test Coverage**:
*   **Unit Tests**:
    *   `SubtitleStep.test.tsx`: Verify clicking a style preset updates the global state. Check that the preview component receives the new style config.
*   **E2E Tests**:
    *   `subtitle-style.spec.ts`: Select "Bold" style -> verify preview text changes font/color -> select "Minimalist" -> verify preview updates matches style definition.

## Phase 4.5: Final Review

**Objective**: A final verification step before committing to the expensive rendering process.

**Key Requirements**:
*   **Summary Dashboard**: Present a consolidated view of all assets: Total duration, Word count, Audio track, Visuals strip, and Subtitle style.
*   **Quick Edits**: Provide "Jump to Edit" links for each section to allow last-minute corrections without losing overall context.
*   **Render Submission**: The final action is a "Render Video" button that validates all steps are complete, deducts credits, and submits the job to the processing queue.

**Test Coverage**:
*   **Unit Tests**:
    *   `ReviewStep.test.tsx`: Verify all summary data matches the input state. Test that the "Render" button calls the submission API and redirects on success.
    *   `Validation.test.tsx`: Test that accessing Review step without completing previous steps redirects or shows error.
*   **E2E Tests**:
    *   `full-workflow-submission.spec.ts`: Complete all previous steps -> Verify summary on Review page -> Click Render -> Verify redirection to "My Videos" or Success page.

---

## Server API Requirements

The backend must expose endpoints to support these phases:

1.  **Audio Generation**: Endpoint to accept script text + tone and return a playable audio URL.
2.  **Visual Segmentation**: Endpoint to analyze the script and audio duration to produce time-coded segments.
3.  **Image Generation**: Endpoint to generate (or regenerate) a single image for a specific segment based on a prompt.
4.  **Render Submission**: Endpoint to accept the finalized state object and trigger the background rendering job.
