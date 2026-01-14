# Implementation Plan: Mode Selection (Entry Point)

## Goal
Add mode selection (Auto Mode vs Editor Mode) as the first choice when users create new content.

---

## Current State Analysis

### Entry Points for Creating Content:
1. **Dashboard Page** (`page.tsx`) → Shows `OnboardingEmptyState` for new users
2. **Onboarding Empty State** (`onboarding-empty-state.tsx`) → Two cards: Single Video / Series
3. **Videos Page** (`videos/page.tsx`) → "Create New" dropdown with Series / Single Video
4. **Videos Empty State** (`videos-empty-state.tsx`) → "Create New" dropdown with same options

### Current Flow:
```
Dashboard → [Single Video | Series] → /create?type=video or /create?type=series
```

### Proposed Flow:
```
Dashboard → [Auto Mode | Editor Mode] → (if Auto) → [Single Video | Series] → /create?type=...
                                       → (if Editor) → /create?type=video&mode=editor
```

---

## Component Separation Strategy

### Problem
Currently, Auto Mode and Editor Mode code is mixed together:
- Single `VideoJobRequest` type with `editorMode` boolean flag
- Single `layout.tsx` with conditional step arrays (`BASE_STEPS` vs `EDITOR_MODE_STEPS`)
- Steps like `script-step.tsx` contain Editor Mode toggle mixed in

### Solution: Separate Folder Structure

```
webapp/client/src/pages/dashboard/
├── create/                          # AUTO MODE (existing, cleaned up)
│   ├── layout.tsx                   # Auto mode layout only
│   ├── context/
│   │   └── auto-creation-context.tsx   # Uses SimpleJobRequest
│   └── steps/
│       ├── niche-step.tsx           # SHARED (used by both modes)
│       ├── script-step.tsx          # Auto mode only (no editor toggle)
│       ├── voice-step.tsx           # SHARED
│       ├── music-step.tsx           # SHARED
│       ├── subtitle-step.tsx        # SHARED
│       └── review-step.tsx          # Auto mode review
│
├── editor/                          # EDITOR MODE (new)
│   ├── layout.tsx                   # Editor mode layout
│   ├── context/
│   │   └── editor-creation-context.tsx  # Uses EditorJobRequest
│   └── steps/
│       ├── script-step.tsx          # Editor version (with Script Editor)
│       ├── audio-step.tsx           # Phase 2: Audio synthesis
│       ├── visuals-step.tsx         # Phase 3: Storyboard + Image gen
│       ├── subtitles-step.tsx       # Phase 4: Style selection
│       └── review-step.tsx          # Phase 5: Final review + render
│
└── shared/                          # SHARED COMPONENTS
    └── steps/
        ├── niche-step.tsx           # Shared niche selection
        ├── voice-step.tsx           # Shared voice selection
        └── music-step.tsx           # Shared music selection
```

---

## Request Type Separation

### Current State
```tsx
// Single unified type with mode flag
interface VideoJobRequest {
    editorMode: boolean  // ← mode mixed into data
    generatedScript?: GeneratedScript
    // ... other fields
}
```

### Proposed State

#### Auto Mode Context (`auto-creation-context.tsx`)
```tsx
// Clean type for auto mode - no editor fields
interface AutoJobRequest {
    jobType: "video" | "series"
    seriesId?: string
    seriesName: string
    episodeTitle: string
    nicheId: string | null
    scriptIdea: string
    duration: number
    segments: number
    visualFormat: "image" | "video"
    voiceId?: string
    visualStyle?: string
    subtitleTemplateId?: string
    musicId?: string
    aspectRatio: "portrait" | "landscape"
    isDraft: boolean
}

// API submission - maps directly to SimpleJobRequest
export function toApiRequest(request: AutoJobRequest): SimpleJobRequest { ... }
```

#### Editor Mode Context (`editor-creation-context.tsx`)
```tsx
// Rich type for editor mode - includes all phases
interface EditorModeRequest {
    // Base fields (same as auto)
    jobType: "video"  // Editor mode is single video only
    episodeTitle: string
    nicheId: string | null
    scriptIdea: string
    duration: number
    visualFormat: "image"
    voiceId?: string
    visualStyle?: string
    aspectRatio: "portrait"
    
    // Phase 1: Script (approved)
    approvedScript: GeneratedScript
    scriptGenerationCount: number
    
    // Phase 2: Audio (new)
    audioUrl?: string
    tonePrompt?: string
    
    // Phase 3: Visuals (new)
    segments: VisualSegment[]
    
    // Phase 4: Subtitles (new)
    subtitleStyleId?: string
    
    // Phase 5: Review
    isDraft: boolean
}

interface VisualSegment {
    id: string
    timeRange: [number, number]
    subtitleText: string
    imagePrompt: string
    imageUrl?: string
}

// API submission - maps to EditorJobRequest
export function toApiRequest(request: EditorModeRequest): EditorJobRequest { ... }
```

---

## Step Configuration

### Auto Mode Steps (6 steps)
| # | Step | Path | Component |
|---|------|------|-----------|
| 1 | Choose Niche | `/create/niche` | `shared/steps/niche-step.tsx` |
| 2 | Script & Idea | `/create/script` | `create/steps/script-step.tsx` |
| 3 | AI Voice | `/create/voice` | `shared/steps/voice-step.tsx` |
| 4 | Background Music | `/create/music` | `shared/steps/music-step.tsx` |
| 5 | Subtitles | `/create/subtitles` | `create/steps/subtitle-step.tsx` |
| 6 | Review | `/create/review` | `create/steps/review-step.tsx` |

### Editor Mode Steps (7 steps)
| # | Step | Path | Component |
|---|------|------|-----------|
| 1 | Choose Niche | `/editor/niche` | `shared/steps/niche-step.tsx` |
| 2 | Script & Details | `/editor/script` | `editor/steps/script-step.tsx` |
| 3 | Audio Synthesis | `/editor/audio` | `editor/steps/audio-step.tsx` |
| 4 | Visuals | `/editor/visuals` | `editor/steps/visuals-step.tsx` |
| 5 | Subtitles | `/editor/subtitles` | `editor/steps/subtitles-step.tsx` |
| 6 | Review & Render | `/editor/review` | `editor/steps/review-step.tsx` |

---

## Routing Configuration

### Current
```tsx
// All routes under /create
<Route path="create" element={<CreateVideoLayout />}>
    <Route path="niche" element={<NicheStep />} />
    <Route path="script" element={<ScriptStep />} />
    // ...
</Route>
```

### Proposed
```tsx
// Auto Mode routes
<Route path="create" element={<AutoModeLayout />}>
    <Route path="niche" element={<SharedNicheStep />} />
    <Route path="script" element={<AutoScriptStep />} />
    <Route path="voice" element={<SharedVoiceStep />} />
    <Route path="music" element={<SharedMusicStep />} />
    <Route path="subtitles" element={<AutoSubtitleStep />} />
    <Route path="review" element={<AutoReviewStep />} />
</Route>

// Editor Mode routes  
<Route path="editor" element={<EditorModeLayout />}>
    <Route path="niche" element={<SharedNicheStep />} />
    <Route path="script" element={<EditorScriptStep />} />
    <Route path="audio" element={<EditorAudioStep />} />
    <Route path="visuals" element={<EditorVisualsStep />} />
    <Route path="subtitles" element={<EditorSubtitlesStep />} />
    <Route path="review" element={<EditorReviewStep />} />
</Route>
```

---

## Migration Plan

### Phase 1: Create Shared Components
1. Move `niche-step.tsx`, `voice-step.tsx`, `music-step.tsx` to `shared/steps/`
2. Remove `editorMode` toggle from script-step (used by Auto only now)

### Phase 2: Create Editor Mode Structure
1. Create `editor/` folder with `layout.tsx`
2. Create `editor-creation-context.tsx` with `EditorModeRequest` type
3. Create editor-specific steps

### Phase 3: Update Entry Points
1. Update `onboarding-empty-state.tsx` with mode selection
2. Auto Mode → `/create?type=...`
3. Editor Mode → `/editor?type=video`

### Phase 4: Cleanup
1. Remove `editorMode` flag from `VideoJobRequest`
2. Remove `EDITOR_MODE_STEPS` from auto `layout.tsx`
3. Update tests

---

## Files to Modify

| File | Change |
|------|--------|
| `onboarding-empty-state.tsx` | Add mode selection step |
| `videos/page.tsx` | Update "Create New" dropdown |
| `videos-empty-state.tsx` | Update "Create New" dropdown |
| `create/layout.tsx` | Remove editor mode logic, use `AutoJobRequest` |
| `create/steps/script-step.tsx` | Remove editor toggle |
| `create/context/creation-context.tsx` | Rename to `auto-creation-context.tsx` |
| `App.tsx` (router) | Add `/editor/*` routes |

## New Files to Create

| File | Purpose |
|------|---------|
| `editor/layout.tsx` | Editor mode layout with 6-step flow |
| `editor/context/editor-creation-context.tsx` | Editor mode state & `EditorModeRequest` |
| `editor/steps/script-step.tsx` | Script + Script Editor combined |
| `editor/steps/audio-step.tsx` | Phase 2: TTS preview & regeneration |
| `editor/steps/visuals-step.tsx` | Phase 3: Image gallery & per-segment gen |
| `editor/steps/subtitles-step.tsx` | Phase 4: Style selection |
| `editor/steps/review-step.tsx` | Phase 5: Final review & render |
| `shared/steps/niche-step.tsx` | Shared niche selection |
| `shared/steps/voice-step.tsx` | Shared voice selection |
| `shared/steps/music-step.tsx` | Shared music selection |

---

## Not In Scope (Future)
- Editor Mode for Series (only Single Video for now)
- Background music selection in Editor Mode
- Custom image upload in Visuals phase

