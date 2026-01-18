# Editor Mode Design Document: "The Director's Chair"

## 1. Overview
The **Editor Mode** transforms the video creation process from a "black box" automated task into a collaborative workspace where the User acts as the **Director** and the AI acts as the **Production Crew**. 

Instead of generating a video in one shot, the process is broken down into distinct **Creative Stages**. At each stage, the user can **Review**, **Edit**, and **Regenerate** the AI's work before moving to the next phase.

---

## 2. Mode Selection (Entry Point)

### Dashboard Landing
When users arrive at the dashboard (or "Create" flow), they see two primary paths:

| ⚡ **Auto Mode** | 🎬 **Editor Mode** |
|------------------|-------------------|
| Quick & Automatic | "The Director's Chair" |
| Let AI handle everything. Best for fast content production. | Take full creative control. Review & edit at every step. |
| Sub-options: Single Video or Series | 5-Phase Workflow (see below) |

### Selection Behavior:
- **Auto Mode** → User selects Video Type (Single/Series), then proceeds through automated pipeline.
- **Editor Mode** → User enters the 5-phase workflow:
    1. Scripting
    2. Audio Synthesis
    3. Visuals (Storyboard & Image Generation)
    4. Subtitles (Style Selection)
    5. Final Review & Render

> **Note**: Editor Mode initially supports **Single Video** only. Series support to follow.

---

## 3. Detailed User Flow


### Phase 1: Scripting
1.  **Input**: User enters "Top 10 AI Tools" + "Tech Niche" + "Excited Tone".
2.  **Generate**: Call `POST /api/editor/script/generate`.
3.  **Review Loop**:
    *   User sees generated text.
    *   *Intervention*: User edits text directly.
    *   *Regenerate*: User can ask for rewrites.
4.  **Approval**: User clicks **"Next: Audio Generation"**.
    *   Action: Save script to DB (`SCRIPT_APPROVED`).

### Phase 2: Audio Synthesis (TTS)
1.  **Process**: System feeds the *entire approved script* to the Audio Model (TTS).
2.  **Review Loop**:
    *   User listens to the full audio track.
    *   *Intervention*: User can regenerate the audio.
        *   **Tone Prompt Input**: A text box where the user can specify the desired tone/style (e.g., "Deep and mysterious", "Fast-paced and energetic").
    *   *Regenerate*: Re-run TTS using the script + the new Tone Prompt.
3.  **Approval**: User clicks **"Next: Analyze & Segment"**.
    *   Action: Save audio file URL to DB (`AUDIO_APPROVED`).

### Phase 3: Visuals (Storyboard & Generation)
1.  **Process** (Initial Setup):
    *   **Transcript & Split**: System analyzes the audio/script to generate subtitles and split content into manageable segments based on timing.
    *   **Visual Prompts**: System generates initial visual prompts for each segment.

2.  **Image Gallery Overview** (Top Section):
    *   **UI Display**: A horizontal row of image thumbnails at the top of the page showing all segment images at a glance.
    *   **Hover Preview**: Hovering over any thumbnail shows:
        *   Enlarged image preview.
        *   Segment number & time range.
        *   Associated subtitle text snippet.
    *   **Quick Navigation**: Clicking a thumbnail scrolls to that segment in the detailed editor below.
    *   **Master Regenerate Button**: A prominent **"🔄 Regenerate All Images"** button at the top-right to regenerate images for all segments in one action.

3.  **Review Loop** (The Visual Editor - Detailed View):
    *   **UI Display**: A unified storyboard interface showing all segments in a vertical card/timeline layout.
    *   **Row Content**: `[ Time Range ] + [ Subtitle Text ] + [ Image Prompt Input ] + [ Image Preview Area ]`.
    *   **Per-Segment Controls**:
        *   **Edit Prompt**: User modifies the prompt text to fix errors or change style.
        *   **🔄 Regenerate**: A button on each segment card to regenerate *only that segment's image*.
        *   **Generate Image**: For initial generation or after prompt edits.
    *   **Feedback**: The generated image appears in the `Image Preview Area` on the same card and updates in the gallery overview above.
    *   **Iterate**: User can re-edit the prompt and click "Regenerate" again if the image isn't right.

4.  **Approval**: User clicks **"Next: Subtitles"**.
    *   Action: Save all finalized image assets (`VISUALS_APPROVED`).

### Phase 4: Subtitles (Style Selection)
1.  **Process** (Initial Setup):
    *   System displays a preview of the generated visuals with subtitle overlays.
    *   Multiple subtitle style presets are available based on app specs.

2.  **Subtitle Style Gallery**:
    *   **UI Display**: A grid/carousel of subtitle style options showing:
        *   Font style.
        *   Color & background treatment (e.g., solid box, transparent, shadow).
        *   Position (bottom, center, top).
        *   Animation effects (e.g., word-by-word highlight, fade-in).
    *   **Live Preview**: Selecting a style instantly updates a sample visual segment so the user can see how subtitles look with their generated images.

3.  **Review Loop**:
    *   **Compare Styles**: User can toggle between different styles to find the best match.
    *   **Customization** (Optional): Fine-tune selected style parameters (font size, colors, etc.).
    *   **Preview Full Segment**: Play a short animated preview of a segment with the selected subtitles.

4.  **Approval**: User clicks **"Next: Final Render"**.
    *   Action: Save subtitle style preferences (`SUBTITLES_APPROVED`).

### Phase 5: Final Review & Render
1.  **Review Summary** (Collect & Organize All Work):
    *   **UI Display**: A single-page summary showing all approved elements:
        *   **Script Preview**: Expandable section showing the approved script text.
        *   **Audio Player**: Mini player to re-listen to the approved TTS audio track.
        *   **Visual Gallery**: Thumbnail strip of all generated images (hover for details).
        *   **Subtitle Style**: Selected style preview with sample text overlay.
    *   **Quick Stats**: Estimated video duration, segment count, total word count.

2.  **Final Checks**:
    *   **Timeline Preview**: Optional animated storyboard preview (images + subtitles synced to audio timing).
    *   **Edit Links**: Each section has a "✏️ Edit" link to jump back to that phase if changes are needed.
    *   **Warnings**: System highlights any issues (e.g., missing images, audio sync problems).

3.  **Render Action** (Bottom Navigation):
    *   **UI Display**: Sticky bottom bar with:
        *   Video settings summary (resolution, format).
        *   **🎬 Render Video** button (prominent, primary action).
    *   **Process** (On Click):
        *   Combine full Audio Track.
        *   Place Images at segment timestamps.
        *   Overlay Subtitles (Burn-in) using the selected style.
    *   **Output**: Final MP4 file with download link & share options.