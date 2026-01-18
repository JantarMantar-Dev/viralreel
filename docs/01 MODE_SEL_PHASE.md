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

## Files to Modify

### 1. [onboarding-empty-state.tsx](file:///Users/minalviradia/CascadeProjects/viralreel/webapp/client/src/pages/dashboard/components/onboarding-empty-state.tsx)

**Changes:**
- Replace current 2-card layout (Single Video / Series) with Mode Selection first
- Add state to track which step user is on: `'mode-select' | 'type-select'`

**New UI Structure:**
```
Step 1: Mode Selection
┌─────────────────────────────┬───────────────────────────────────┐
│  ⚡ Auto Mode               │  🎬 Editor Mode                   │
│  Quick & Automatic          │  "The Director's Chair"           │
│                             │                                   │
│  Let AI handle everything.  │  Take full creative control.      │
│  Perfect for fast content.  │  Review & refine every step.      │
│                             │                                   │
│  [Get Started →]            │  [Open Editor →]                  │
└─────────────────────────────┴───────────────────────────────────┘

Step 2: Type Selection (Auto Mode only)
┌─────────────────────────────┬───────────────────────────────────┐
│  🎬 Single Video            │  📚 Create Series                 │
│  (existing cards)           │  (existing cards)                 │
└─────────────────────────────┴───────────────────────────────────┘
```

**Code Changes:**
```tsx
// Add state
const [step, setStep] = useState<'mode-select' | 'type-select'>('mode-select')
const [selectedMode, setSelectedMode] = useState<'auto' | 'editor' | null>(null)

// Step 1: Mode Selection
if (step === 'mode-select') {
  return (
    // Two cards: Auto Mode, Editor Mode
    // Auto Mode → setStep('type-select'), setSelectedMode('auto')
    // Editor Mode → navigate('/create?type=video&mode=editor')
  )
}

// Step 2: Type Selection (existing cards, only for Auto Mode)
return (
  // Existing Single Video / Series cards
  // Links: /create?type=video or /create?type=series
)
```

---

### 2. [videos/page.tsx](file:///Users/minalviradia/CascadeProjects/viralreel/webapp/client/src/pages/dashboard/videos/page.tsx)

**Current (lines 324-340):** "Create New" dropdown with Series / Single Video options

**Changes:**
- Add Mode sub-menu or restructure dropdown:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Create New</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Choose Mode</DropdownMenuLabel>
    <DropdownMenuItem>⚡ Auto Mode (Quick)</DropdownMenuItem>
    <DropdownMenuItem>🎬 Editor Mode (Full Control)</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```
- Auto Mode → Opens sub-menu or navigates to type selection
- Editor Mode → Navigate to `/create?type=video&mode=editor`

---

### 3. [videos-empty-state.tsx](file:///Users/minalviradia/CascadeProjects/viralreel/webapp/client/src/pages/dashboard/videos/components/videos-empty-state.tsx)

**Current:** Same dropdown as videos/page.tsx

**Changes:** Mirror the changes from videos/page.tsx dropdown

---

### 4. [create/layout.tsx](file:///Users/minalviradia/CascadeProjects/viralreel/webapp/client/src/pages/dashboard/create/layout.tsx)

**Changes:**
- Read `mode=editor` from URL search params
- Auto-set `editorMode: true` in context when param is present

```tsx
// In useEffect or initialization
const searchParams = new URLSearchParams(location.search);
const isEditorMode = searchParams.get('mode') === 'editor';

if (isEditorMode && !request.editorMode) {
  updateRequest({ editorMode: true });
}
```

---

### 5. [create/steps/script-step.tsx](file:///Users/minalviradia/CascadeProjects/viralreel/webapp/client/src/pages/dashboard/create/steps/script-step.tsx)

**Changes:**
- Remove Editor Mode toggle section (lines 66-116)
- Mode is now determined at entry, not toggled mid-flow

---

## UI Design Details

### Mode Selection Cards

| Property | Auto Mode | Editor Mode |
|----------|-----------|-------------|
| Icon | ⚡ or `Zap` | 🎬 or `Clapperboard` |
| Title | Auto Mode | Editor Mode |
| Subtitle | Quick & Automatic | "The Director's Chair" |
| Description | Let AI handle everything. Perfect for fast content production. | Take full creative control. Review, edit & refine at every step. |
| Badge | — | NEW |
| Button | Get Started → | Open Editor → |
| Color | Purple gradient | Blue/Indigo gradient |

### Visual Style
- Same card styling as current Single Video / Series cards
- Hover effects: `hover:border-purple-200 hover:shadow-xl`
- Selected state (if needed): purple border highlight

---

## Navigation Routes

| Action | Route |
|--------|-------|
| Auto Mode → Single Video | `/create?type=video` |
| Auto Mode → Series | `/create?type=series` |
| Editor Mode | `/create?type=video&mode=editor` |

---

## Implementation Order

1. **Update `onboarding-empty-state.tsx`** - Add mode selection step
2. **Update `videos/page.tsx`** dropdown - Add mode options
3. **Update `videos-empty-state.tsx`** dropdown - Mirror changes
4. **Update `create/layout.tsx`** - Read mode from URL params
5. **Update `script-step.tsx`** - Remove toggle (now redundant)
6. **Test all entry points** - Verify correct routing

---


