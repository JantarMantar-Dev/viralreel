# Phase 04: Editor Mode Implementation

This document covers the implementation of Editor Mode phases, starting with the existing script editing functionality and expanding to cover all 5 phases defined in `EDITOR_MODE_DESIGN.md`.

---

## Summary

| Phase | Component | Status | Description |
|-------|-----------|--------|-------------|
| 4.1 | Script Editor | ✅ EXISTS | Script generation, preview, feedback, regeneration |
| 4.2 | Audio Synthesis | 🆕 NEW | TTS preview, tone prompt, audio regeneration |
| 4.3 | Visuals Editor | 🆕 NEW | Image gallery, per-segment generation, prompts |
| 4.4 | Subtitles Editor | 🆕 NEW | Style selection, live preview |
| 4.5 | Final Review | 🆕 NEW | Summary page, render button |

---

## Existing Implementation (To Be Migrated)

### Client-Side Files

| File | Purpose | Migration Target |
|------|---------|------------------|
| `create/steps/script-editor-step.tsx` | Script generation UI | `editor/steps/script-step.tsx` |
| `create/context/creation-context.tsx` | Context with `generatedScript` | `editor/context/editor-creation-context.tsx` |
| `create/__tests__/editor-mode-workflow.test.tsx` | Integration tests | `editor/__tests__/` |

### Server-Side Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `server/src/api/scripting.ts` | `/api/scripting/generate`, `/api/scripting/regenerate` | No changes (shared) |
| `server/src/api/editor-jobs.ts` | `/api/editor-jobs` CRUD | Add new phases support |
| `server/src/services/editor-video-service.ts` | Job creation logic | Add phase tracking |

---

## Phase 4.1: Script Editor (Migration)

### Existing Implementation

**File**: `webapp/client/src/pages/dashboard/create/steps/script-editor-step.tsx`

**Features Already Implemented**:
- ✅ Script idea preview from previous step
- ✅ "Generate Script" button with API call to `/api/scripting/generate`
- ✅ Generated script display (expandable)
- ✅ Word count badge
- ✅ Feedback textarea for regeneration
- ✅ "Regenerate with Feedback" button calling `/api/scripting/regenerate`
- ✅ Generation counter (3 max attempts)
- ✅ "No more regenerations" warning
- ✅ Tips section

**API Endpoints (Exist)**:
```
POST /api/scripting/generate
POST /api/scripting/regenerate
```

### Migration Steps

#### Step 4.1.1: Create editor script step file
```bash
cp webapp/client/src/pages/dashboard/create/steps/script-editor-step.tsx \
   webapp/client/src/pages/dashboard/editor/steps/script-step.tsx
```

#### Step 4.1.2: Update imports
```tsx
// Change from:
import { useCreation } from "../context/creation-context"

// Change to:
import { useEditorCreation } from "../context/editor-creation-context"
```

#### Step 4.1.3: Merge script input with editor
- Add episode title input field (from script-step.tsx)
- Add duration selection (from script-step.tsx)
- Add visual style selection (from script-step.tsx)
- Keep all existing script generation logic

#### Step 4.1.4: Update context usage
```tsx
// Use EditorModeRequest fields
const { request, updateRequest } = useEditorCreation()

// Access fields
request.approvedScript  // Instead of request.generatedScript
request.scriptGenerationCount
```

#### Step 4.1.5: Add "Accept Script" action
```tsx
// When user accepts script
const handleAcceptScript = () => {
    updateRequest({ 
        approvedScript: request.generatedScript,
        scriptApproved: true 
    })
    nextStep()
}
```

---

## Phase 4.2: Audio Synthesis (New)

### Design Reference
From `EDITOR_MODE_DESIGN.md` Phase 2:
- System feeds approved script to TTS model
- User listens to full audio track
- Tone prompt input for style control
- Regenerate audio with new tone

### Implementation Steps

#### Step 4.2.1: Create audio-step.tsx
```bash
touch webapp/client/src/pages/dashboard/editor/steps/audio-step.tsx
```

#### Step 4.2.2: Audio Step UI Components
```tsx
export default function AudioStep() {
    const { request, updateRequest } = useEditorCreation()
    
    return (
        <div>
            <StepHeader
                title="Audio Synthesis"
                description="Preview your AI-generated voiceover and adjust the tone"
            />
            
            {/* Audio Player */}
            <AudioPreviewPlayer audioUrl={request.audioUrl} />
            
            {/* Tone Prompt Input */}
            <TonePromptInput 
                value={request.tonePrompt}
                onChange={(v) => updateRequest({ tonePrompt: v })}
            />
            
            {/* Regenerate Button */}
            <Button onClick={handleRegenerateAudio}>
                Regenerate Audio
            </Button>
        </div>
    )
}
```

#### Step 4.2.3: Create Audio API Route (Server)
```typescript
// POST /api/editor/audio/generate
// POST /api/editor/audio/regenerate

fastify.post("/generate", async (request, reply) => {
    const { script, voiceId, tonePrompt } = request.body
    
    // Call TTS service
    const audioUrl = await generateTTSAudio({
        text: script,
        voiceId,
        tonePrompt
    })
    
    return { audioUrl }
})
```

#### Step 4.2.4: Audio Preview Component
```tsx
// components/audio-preview-player.tsx
export function AudioPreviewPlayer({ audioUrl }: { audioUrl?: string }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    
    // Play/pause controls
    // Progress bar
    // Time display
}
```

---

## Phase 4.3: Visuals Editor (New)

### Design Reference
From `EDITOR_MODE_DESIGN.md` Phase 3:
- Image Gallery Overview (horizontal thumbnails)
- Per-segment cards with prompt editing
- Individual and bulk regeneration
- Hover previews

### Implementation Steps

#### Step 4.3.1: Create visuals-step.tsx
```bash
touch webapp/client/src/pages/dashboard/editor/steps/visuals-step.tsx
```

#### Step 4.3.2: Visuals Step Structure
```tsx
export default function VisualsStep() {
    return (
        <div>
            <StepHeader
                title="Visuals"
                description="Review and customize images for each segment"
            />
            
            {/* Gallery Overview */}
            <ImageGalleryStrip 
                segments={request.segments}
                onThumbnailClick={scrollToSegment}
            />
            
            {/* Master Regenerate */}
            <Button onClick={handleRegenerateAll}>
                🔄 Regenerate All Images
            </Button>
            
            {/* Segment Cards */}
            {request.segments.map((segment, index) => (
                <SegmentCard
                    key={segment.id}
                    segment={segment}
                    onPromptChange={(prompt) => updateSegment(index, { imagePrompt: prompt })}
                    onRegenerate={() => regenerateSegment(index)}
                />
            ))}
        </div>
    )
}
```

#### Step 4.3.3: Segment Card Component
```tsx
// components/segment-card.tsx
interface SegmentCardProps {
    segment: VisualSegment
    onPromptChange: (prompt: string) => void
    onRegenerate: () => void
}

export function SegmentCard({ segment, onPromptChange, onRegenerate }) {
    return (
        <Card>
            {/* Time Range */}
            <TimeRangeBadge start={segment.timeRange[0]} end={segment.timeRange[1]} />
            
            {/* Subtitle Text */}
            <p className="text-slate-600">{segment.subtitleText}</p>
            
            {/* Image Prompt Input */}
            <Textarea
                value={segment.imagePrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Describe the visual for this segment..."
            />
            
            {/* Image Preview */}
            {segment.imageUrl ? (
                <img src={segment.imageUrl} alt={`Segment ${segment.id}`} />
            ) : (
                <div className="placeholder">No image generated</div>
            )}
            
            {/* Regenerate Button */}
            <Button onClick={onRegenerate}>
                🔄 Regenerate
            </Button>
        </Card>
    )
}
```

#### Step 4.3.4: Create Image Generation API (Server)
```typescript
// POST /api/editor/visuals/generate-segment
// POST /api/editor/visuals/generate-all

fastify.post("/generate-segment", async (request, reply) => {
    const { segmentId, prompt, style } = request.body
    
    const imageUrl = await generateImage({
        prompt,
        style,
        aspectRatio: "portrait"
    })
    
    return { segmentId, imageUrl }
})

fastify.post("/generate-all", async (request, reply) => {
    const { segments, style } = request.body
    
    const results = await Promise.all(
        segments.map(seg => generateImage({ prompt: seg.prompt, style }))
    )
    
    return { segments: results }
})
```

#### Step 4.3.5: Image Gallery Strip Component
```tsx
// components/image-gallery-strip.tsx
export function ImageGalleryStrip({ segments, onThumbnailClick }) {
    return (
        <div className="flex gap-2 overflow-x-auto p-4 bg-slate-50 rounded-xl">
            {segments.map((segment, index) => (
                <HoverCard key={segment.id}>
                    <HoverCardTrigger asChild>
                        <button
                            onClick={() => onThumbnailClick(index)}
                            className="shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                        >
                            <img 
                                src={segment.imageUrl || '/placeholder.png'}
                                alt={`Segment ${index + 1}`}
                            />
                        </button>
                    </HoverCardTrigger>
                    <HoverCardContent>
                        {/* Enlarged preview */}
                        <img src={segment.imageUrl} className="w-48 h-48" />
                        <p>Segment {index + 1}</p>
                        <p>{formatTimeRange(segment.timeRange)}</p>
                        <p className="text-xs">{segment.subtitleText}</p>
                    </HoverCardContent>
                </HoverCard>
            ))}
        </div>
    )
}
```

---

## Phase 4.4: Subtitles Editor (New)

### Design Reference
From `EDITOR_MODE_DESIGN.md` Phase 4:
- Style gallery with presets
- Live preview with selected style
- Font, color, position, animation options

### Implementation Steps

#### Step 4.4.1: Create subtitles-step.tsx
```bash
touch webapp/client/src/pages/dashboard/editor/steps/subtitles-step.tsx
```

#### Step 4.4.2: Subtitles Step Structure
```tsx
export default function SubtitlesStep() {
    const { request, updateRequest } = useEditorCreation()
    
    return (
        <div>
            <StepHeader
                title="Subtitles"
                description="Choose a style for your video subtitles"
            />
            
            {/* Live Preview */}
            <SubtitlePreview
                imageUrl={request.segments[0]?.imageUrl}
                text={request.segments[0]?.subtitleText}
                styleId={request.subtitleStyleId}
            />
            
            {/* Style Gallery */}
            <StyleGallery
                selectedId={request.subtitleStyleId}
                onSelect={(id) => updateRequest({ subtitleStyleId: id })}
            />
        </div>
    )
}
```

#### Step 4.4.3: Style Gallery Component
```tsx
// components/style-gallery.tsx
const SUBTITLE_STYLES = [
    { id: 'classic', name: 'Classic', font: 'sans', color: 'white', bg: 'black' },
    { id: 'bold', name: 'Bold', font: 'bold', color: 'yellow', bg: 'transparent' },
    { id: 'minimal', name: 'Minimal', font: 'thin', color: 'white', bg: 'blur' },
    // ... more styles
]

export function StyleGallery({ selectedId, onSelect }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SUBTITLE_STYLES.map(style => (
                <button
                    key={style.id}
                    onClick={() => onSelect(style.id)}
                    className={cn(
                        "p-4 rounded-xl border-2",
                        selectedId === style.id 
                            ? "border-purple-500 bg-purple-50"
                            : "border-slate-200"
                    )}
                >
                    <SubtitleStylePreview style={style} />
                    <p className="mt-2 font-medium">{style.name}</p>
                </button>
            ))}
        </div>
    )
}
```

---

## Phase 4.5: Final Review (New)

### Design Reference
From `EDITOR_MODE_DESIGN.md` Phase 5:
- Summary page with all approved elements
- Quick stats
- Edit links to jump back
- Render button

### Implementation Steps

#### Step 4.5.1: Create review-step.tsx
```bash
touch webapp/client/src/pages/dashboard/editor/steps/review-step.tsx
```

#### Step 4.5.2: Review Step Structure
```tsx
export default function ReviewStep() {
    const { request, submitJob } = useEditorCreation()
    
    return (
        <div>
            <StepHeader
                title="Final Review"
                description="Review your video before rendering"
            />
            
            {/* Quick Stats */}
            <QuickStats
                duration={request.approvedScript?.estimatedDurationSeconds}
                segmentCount={request.segments.length}
                wordCount={request.approvedScript?.wordCount}
            />
            
            {/* Script Section */}
            <ReviewSection title="Script" editLink="/editor/script">
                <ScriptPreview script={request.approvedScript?.story} />
            </ReviewSection>
            
            {/* Audio Section */}
            <ReviewSection title="Audio" editLink="/editor/audio">
                <AudioMiniPlayer audioUrl={request.audioUrl} />
            </ReviewSection>
            
            {/* Visuals Section */}
            <ReviewSection title="Visuals" editLink="/editor/visuals">
                <ImageStrip segments={request.segments} />
            </ReviewSection>
            
            {/* Subtitles Section */}
            <ReviewSection title="Subtitles" editLink="/editor/subtitles">
                <SubtitleStyleBadge styleId={request.subtitleStyleId} />
            </ReviewSection>
            
            {/* Render Button (Sticky Footer) */}
            <StickyFooter>
                <Button onClick={submitJob} className="w-full">
                    🎬 Render Video
                </Button>
            </StickyFooter>
        </div>
    )
}
```

#### Step 4.5.3: Review Section Component
```tsx
// components/review-section.tsx
export function ReviewSection({ title, editLink, children }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <Link to={editLink}>
                    ✏️ Edit
                </Link>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}
```

---

## Server API Routes Summary

### New Routes to Create

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/editor/audio/generate` | POST | Generate TTS audio |
| `/api/editor/audio/regenerate` | POST | Regenerate with tone |
| `/api/editor/visuals/segment` | POST | Generate single image |
| `/api/editor/visuals/all` | POST | Generate all images |
| `/api/editor/visuals/analyze` | POST | Segment script + generate prompts |

### Existing Routes (No Changes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scripting/generate` | POST | Generate script |
| `/api/scripting/regenerate` | POST | Regenerate script with feedback |
| `/api/editor-jobs` | POST | Create editor job |
| `/api/editor-jobs/:id` | PATCH | Update editor job |

---

## Database Schema Updates

### Add Phase Tracking to Video Table
```sql
-- Add columns to track editor mode progress
ALTER TABLE video ADD COLUMN editor_phase VARCHAR(20);
-- Values: 'script' | 'audio' | 'visuals' | 'subtitles' | 'review' | 'rendered'

ALTER TABLE video ADD COLUMN editor_data JSONB;
-- Stores: { approvedScript, audioUrl, segments[], subtitleStyleId }
```

---

## File Checklist

### Client Files to Create (Phase 4)

| File | Phase |
|------|-------|
| `editor/steps/script-step.tsx` | 4.1 |
| `editor/steps/audio-step.tsx` | 4.2 |
| `editor/steps/visuals-step.tsx` | 4.3 |
| `editor/steps/subtitles-step.tsx` | 4.4 |
| `editor/steps/review-step.tsx` | 4.5 |
| `editor/components/audio-preview-player.tsx` | 4.2 |
| `editor/components/segment-card.tsx` | 4.3 |
| `editor/components/image-gallery-strip.tsx` | 4.3 |
| `editor/components/style-gallery.tsx` | 4.4 |
| `editor/components/review-section.tsx` | 4.5 |

### Server Files to Create (Phase 4)

| File | Phase |
|------|-------|
| `api/editor-audio.ts` | 4.2 |
| `api/editor-visuals.ts` | 4.3 |
| `services/editor-audio-service.ts` | 4.2 |
| `services/editor-visual-service.ts` | 4.3 |

---

## Implementation Order

1. **4.1** - Migrate script-editor-step to editor/steps/script-step.tsx
2. **4.2** - Create audio synthesis step (depends on 4.1 output)
3. **4.3** - Create visuals step (depends on 4.2 output - needs audio for timing)
4. **4.4** - Create subtitles step (depends on 4.3 - needs visuals)
5. **4.5** - Create review step (summary of all phases)

### API Route Priority

1. First: Client-side with mock data
2. Second: `/api/editor/audio/*` routes
3. Third: `/api/editor/visuals/*` routes
4. Fourth: Update `/api/editor-jobs` to accept full phase data
