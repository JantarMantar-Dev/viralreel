# Phase 03: Implementation Steps

This document breaks down the implementation from `01 MODE_SEL_PHASE.md` and `02 REFECTOR_PHASE.md` into granular, executable steps.

---

## Summary of Work

| Phase | Description | Estimated Steps |
|-------|-------------|-----------------|
| 3.1 | Create Shared Components Folder | 6 steps |
| 3.2 | Create Editor Mode Structure | 8 steps |
| 3.3 | Create Auto Mode Context | 4 steps |
| 3.4 | Update Entry Points (Mode Selection UI) | 6 steps |
| 3.5 | Update Routing Configuration | 3 steps |
| 3.6 | Cleanup Legacy Code | 5 steps |
| 3.7 | Testing & Verification | 4 steps |

**Total: ~36 implementation steps**

---

## Phase 3.1: Create Shared Components Folder

Steps to extract shared components that both Auto and Editor modes will use.

### Step 3.1.1: Create shared folder structure
```bash
mkdir -p webapp/client/src/pages/dashboard/shared/steps
```

### Step 3.1.2: Move niche-step.tsx to shared
- Copy `create/steps/niche-step.tsx` → `shared/steps/niche-step.tsx`
- Update imports if needed (context hook should be generic)
- Add abstraction layer for context (both modes use same niche selection)

### Step 3.1.3: Move voice-step.tsx to shared
- Copy `create/steps/voice-step.tsx` → `shared/steps/voice-step.tsx`
- Update imports

### Step 3.1.4: Move music-step.tsx to shared
- Copy `create/steps/music-step.tsx` → `shared/steps/music-step.tsx`
- Update imports

### Step 3.1.5: Create shared context interface
- Create `shared/context/shared-creation-interface.ts`
- Define common interface for context that both modes implement:
```tsx
interface SharedCreationContext {
    nicheId: string | null
    updateNicheId: (id: string) => void
    voiceId?: string
    updateVoiceId: (id: string) => void
    musicId?: string
    updateMusicId: (id: string) => void
    nextStep: () => void
    prevStep: () => void
}
```

### Step 3.1.6: Update shared steps to use interface
- Update `shared/steps/niche-step.tsx` to use `SharedCreationContext`
- Update `shared/steps/voice-step.tsx` to use `SharedCreationContext`
- Update `shared/steps/music-step.tsx` to use `SharedCreationContext`

---

## Phase 3.2: Create Editor Mode Structure

Steps to create the complete Editor Mode folder and components.

### Step 3.2.1: Create editor folder structure
```bash
mkdir -p webapp/client/src/pages/dashboard/editor/steps
mkdir -p webapp/client/src/pages/dashboard/editor/context
```

### Step 3.2.2: Create EditorModeRequest type
- Create `editor/context/editor-creation-context.tsx`
- Define `EditorModeRequest` interface with all phase fields:
```tsx
interface EditorModeRequest {
    // Base fields
    jobType: "video"
    episodeTitle: string
    nicheId: string | null
    scriptIdea: string
    duration: number
    visualFormat: "image"
    voiceId?: string
    visualStyle?: string
    aspectRatio: "portrait"
    
    // Phase 1: Script
    approvedScript?: GeneratedScript
    scriptGenerationCount: number
    
    // Phase 2: Audio
    audioUrl?: string
    tonePrompt?: string
    
    // Phase 3: Visuals
    segments: VisualSegment[]
    
    // Phase 4: Subtitles
    subtitleStyleId?: string
    
    // Phase 5: Review
    isDraft: boolean
}
```

### Step 3.2.3: Create EditorCreationContext provider
- Create context provider with state management
- Implement `updateRequest` function
- Implement `toApiRequest` function for API submission

### Step 3.2.4: Create editor/layout.tsx
- Copy structure from `create/layout.tsx`
- Update STEPS array for editor mode (6 steps):
  1. Choose Niche
  2. Script & Details
  3. Audio Synthesis
  4. Visuals
  5. Subtitles
  6. Review & Render
- Use `EditorCreationContext` instead of `CreationContext`
- Remove series-related logic (editor is single video only)

### Step 3.2.5: Create editor/steps/script-step.tsx
- Combine script input + script editor functionality
- Include script generation with feedback loop
- Remove toggle (always in editor mode)

### Step 3.2.6: Create editor/steps/audio-step.tsx
- Create Phase 2: Audio Synthesis step
- Include: TTS audio preview player
- Include: Tone prompt input for regeneration
- Include: Regenerate audio button

### Step 3.2.7: Create editor/steps/visuals-step.tsx
- Create Phase 3: Visuals step
- Include: Image Gallery Overview (horizontal thumbnails)
- Include: Per-segment card view with:
  - Time range
  - Subtitle text
  - Image prompt input
  - Generated image preview
  - Regenerate button per segment
- Include: "Regenerate All" master button

### Step 3.2.8: Create editor/steps/subtitles-step.tsx
- Create Phase 4: Subtitles Style Selection
- Include: Style gallery grid/carousel
- Include: Live preview with selected style
- Include: Style options (font, color, position, animation)

### Step 3.2.9: Create editor/steps/review-step.tsx
- Create Phase 5: Final Review & Render
- Include: Review summary with all approved elements
- Include: Quick stats (duration, segments, word count)
- Include: Edit links to jump back to any phase
- Include: Sticky bottom bar with Render button

---

## Phase 3.3: Create Auto Mode Context

Steps to clean up the Auto Mode (existing create flow).

### Step 3.3.1: Create AutoJobRequest type
- Create `create/context/auto-creation-context.tsx`
- Define clean `AutoJobRequest` without editor fields:
```tsx
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
```

### Step 3.3.2: Create AutoCreationContext provider
- Create context provider
- Implement `toApiRequest` mapping to `SimpleJobRequest`

### Step 3.3.3: Update create/layout.tsx
- Remove `EDITOR_MODE_STEPS` array
- Keep only `BASE_STEPS` (6 steps)
- Replace `VideoJobRequest` with `AutoJobRequest`
- Remove editor mode conditional logic

### Step 3.3.4: Update create/steps/script-step.tsx
- Remove Editor Mode toggle section (lines 66-116)
- Keep only auto mode functionality

---

## Phase 3.4: Update Entry Points (Mode Selection UI)

Steps to add mode selection to all entry points.

### Step 3.4.1: Update onboarding-empty-state.tsx - Add state
```tsx
const [step, setStep] = useState<'mode-select' | 'type-select'>('mode-select')
const navigate = useNavigate()
```

### Step 3.4.2: Update onboarding-empty-state.tsx - Mode selection UI
- Create two cards for mode selection:
  - ⚡ Auto Mode card
  - 🎬 Editor Mode card
- Style matching existing cards
- Add "NEW" badge to Editor Mode

### Step 3.4.3: Update onboarding-empty-state.tsx - Navigation logic
- Auto Mode click → `setStep('type-select')`
- Editor Mode click → `navigate('/editor/niche')`
- Type selection (step 2) → existing `/create?type=...` routes

### Step 3.4.4: Update videos/page.tsx dropdown
- Modify "Create New" dropdown (lines 324-340)
- Add mode selection options:
  - ⚡ Auto Mode → shows sub-menu with Series/Video
  - 🎬 Editor Mode → navigates to `/editor/niche`

### Step 3.4.5: Update videos-empty-state.tsx dropdown
- Mirror changes from videos/page.tsx
- Same dropdown structure with mode selection

### Step 3.4.6: Add back button to type selection
- In onboarding-empty-state when `step === 'type-select'`
- Add "← Back to mode selection" link

---

## Phase 3.5: Update Routing Configuration

Steps to add Editor Mode routes to the app router.

### Step 3.5.1: Locate App.tsx or router config
- Find where routes are defined
- Identify pattern for adding new route group

### Step 3.5.2: Add Editor Mode route group
```tsx
// Add after /create routes
<Route path="editor" element={<EditorModeLayout />}>
    <Route index element={<Navigate to="niche" replace />} />
    <Route path="niche" element={<SharedNicheStep />} />
    <Route path="script" element={<EditorScriptStep />} />
    <Route path="audio" element={<EditorAudioStep />} />
    <Route path="visuals" element={<EditorVisualsStep />} />
    <Route path="subtitles" element={<EditorSubtitlesStep />} />
    <Route path="review" element={<EditorReviewStep />} />
</Route>
```

### Step 3.5.3: Update create routes to use shared steps
```tsx
<Route path="create" element={<AutoModeLayout />}>
    <Route index element={<Navigate to="niche" replace />} />
    <Route path="niche" element={<SharedNicheStep />} />
    <Route path="script" element={<AutoScriptStep />} />
    <Route path="voice" element={<SharedVoiceStep />} />
    <Route path="music" element={<SharedMusicStep />} />
    <Route path="subtitles" element={<AutoSubtitleStep />} />
    <Route path="review" element={<AutoReviewStep />} />
</Route>
```

---

## Phase 3.6: Cleanup Legacy Code

Steps to remove old mixed-mode code.

### Step 3.6.1: Remove editorMode from VideoJobRequest
- Delete `editorMode: boolean` field
- Delete `generatedScript?: GeneratedScript` field
- Delete `scriptGenerationCount: number` field
- Delete `scriptFeedback?: string` field

### Step 3.6.2: Delete old creation-context.tsx
- Remove `create/context/creation-context.tsx` (replaced by auto-creation-context.tsx)
- Or rename it to `auto-creation-context.tsx`

### Step 3.6.3: Remove EDITOR_MODE_STEPS from layout
- Delete the constant from `create/layout.tsx`
- Remove the useMemo that switches between step arrays

### Step 3.6.4: Delete script-editor-step.tsx from create/steps
- This is now part of `editor/steps/script-step.tsx`

### Step 3.6.5: Update all imports
- Search for imports from old `creation-context.tsx`
- Update to new context files
- Fix any broken imports after file moves

---

## Phase 3.7: Testing & Verification

This phase covers all unit tests (UT) and end-to-end (E2E) tests needed to verify the implementation.

---

### Existing Test Files to Update

| File | Current Purpose | Changes Needed |
|------|-----------------|----------------|
| `create/__tests__/editor-mode-workflow.test.tsx` | Tests editor toggle & script editor | **MOVE** to `editor/__tests__/` or **DELETE** (logic moves to editor mode) |
| `create/__tests__/layout-integration.test.tsx` | Tests layout with dynamic steps | Remove editor mode step logic |
| `create/__tests__/script-step.test.tsx` | Tests script step with editor toggle | Remove editor toggle tests |
| `create/__tests__/step-validation.test.ts` | Tests validation for `VideoJobRequest` | Update to test `AutoJobRequest` |

---

### New Test Files to Create

#### Unit Tests (Vitest)

| File | Purpose |
|------|---------|
| `shared/__tests__/niche-step.test.tsx` | Test shared niche step with mock context |
| `shared/__tests__/voice-step.test.tsx` | Test shared voice step with mock context |
| `shared/__tests__/music-step.test.tsx` | Test shared music step with mock context |
| `editor/__tests__/editor-creation-context.test.tsx` | Test `EditorModeRequest` state management |
| `editor/__tests__/layout.test.tsx` | Test editor layout step navigation |
| `editor/__tests__/script-step.test.tsx` | Test script generation & feedback loop |
| `editor/__tests__/audio-step.test.tsx` | Test audio synthesis controls |
| `editor/__tests__/visuals-step.test.tsx` | Test image gallery & per-segment regeneration |
| `editor/__tests__/subtitles-step.test.tsx` | Test style selection |
| `editor/__tests__/review-step.test.tsx` | Test final review & render button |
| `components/__tests__/onboarding-empty-state.test.tsx` | Test mode selection step switching |

#### E2E Tests (Playwright)

| File | Purpose |
|------|---------|
| `e2e/tests/mode-selection.spec.ts` | Test mode selection from dashboard |
| `e2e/tests/auto-mode-flow.spec.ts` | Test complete Auto Mode journey |
| `e2e/tests/editor-mode-flow.spec.ts` | Test complete Editor Mode journey |

---

## Phase 3.7.1: Unit Tests for Shared Components

### Test: `shared/__tests__/niche-step.test.tsx`
```tsx
describe('SharedNicheStep', () => {
    it('should render niche selection grid')
    it('should call updateNicheId when niche is selected')
    it('should highlight selected niche')
    it('should disable continue when no niche selected')
    it('should work with both Auto and Editor context providers')
})
```

### Test: `shared/__tests__/voice-step.test.tsx`
```tsx
describe('SharedVoiceStep', () => {
    it('should render voice list')
    it('should play voice preview on click')
    it('should call updateVoiceId when voice is selected')
    it('should show selected voice name')
})
```

### Test: `shared/__tests__/music-step.test.tsx`
```tsx
describe('SharedMusicStep', () => {
    it('should render music list')
    it('should play music preview on click')
    it('should call updateMusicId when music is selected')
    it('should allow skipping music selection')
})
```

---

## Phase 3.7.2: Unit Tests for Editor Mode

### Test: `editor/__tests__/editor-creation-context.test.tsx`
```tsx
describe('EditorCreationContext', () => {
    it('should initialize with default EditorModeRequest')
    it('should update request fields correctly')
    it('should track approvedScript state')
    it('should track segments array for visuals')
    it('should convert to EditorJobRequest for API submission')
})
```

### Test: `editor/__tests__/layout.test.tsx`
```tsx
describe('EditorModeLayout', () => {
    it('should render 6 step indicators')
    it('should navigate between steps')
    it('should show correct step title in header')
    it('should disable navigation to future steps')
    it('should allow back navigation')
})
```

### Test: `editor/__tests__/script-step.test.tsx`
```tsx
describe('EditorScriptStep', () => {
    it('should show script details form')
    it('should call script generation API')
    it('should display generated script')
    it('should allow feedback input for regeneration')
    it('should limit regeneration attempts to 3')
    it('should enable continue when script is approved')
})
```

### Test: `editor/__tests__/audio-step.test.tsx`
```tsx
describe('EditorAudioStep', () => {
    it('should display audio player')
    it('should play/pause audio preview')
    it('should show tone prompt input')
    it('should call audio regeneration API')
    it('should show loading state during generation')
})
```

### Test: `editor/__tests__/visuals-step.test.tsx`
```tsx
describe('EditorVisualsStep', () => {
    it('should display image gallery overview')
    it('should show segment cards with prompts')
    it('should call image generation API for single segment')
    it('should call regenerate all API')
    it('should update image preview on generation')
    it('should show hover preview on gallery thumbnails')
})
```

### Test: `editor/__tests__/subtitles-step.test.tsx`
```tsx
describe('EditorSubtitlesStep', () => {
    it('should display style gallery')
    it('should show live preview with selected style')
    it('should update subtitleStyleId on selection')
    it('should show style details (font, color, position)')
})
```

### Test: `editor/__tests__/review-step.test.tsx`
```tsx
describe('EditorReviewStep', () => {
    it('should display all approved elements')
    it('should show script preview section')
    it('should show audio player')
    it('should show visual gallery strip')
    it('should show selected subtitle style')
    it('should show quick stats')
    it('should have edit links to each phase')
    it('should call render API on button click')
})
```

---

## Phase 3.7.3: Unit Tests for Auto Mode Updates

### Test: Update `create/__tests__/script-step.test.tsx`
```tsx
describe('AutoScriptStep', () => {
    // REMOVE these tests:
    // - 'should display Editor Mode toggle'
    // - 'should toggle Editor Mode on/off'
    // - 'should show editor info when enabled'
    
    // KEEP these tests:
    it('should render script details form')
    it('should allow video name input')
    it('should allow script idea input')
    it('should allow duration selection')
    it('should allow visual style selection')
    it('should allow aspect ratio selection')
})
```

### Test: Update `create/__tests__/step-validation.test.ts`
```tsx
describe('AutoModeValidation', () => {
    // Update to use AutoJobRequest instead of VideoJobRequest
    it('should validate script idea is required')
    it('should validate episode title is required')
    it('should validate series name for series type')
    
    // REMOVE editorMode-related validation tests
})
```

---

## Phase 3.7.4: Unit Tests for Entry Points

### Test: `components/__tests__/onboarding-empty-state.test.tsx`
```tsx
describe('OnboardingEmptyState', () => {
    it('should show mode selection as first step')
    it('should display Auto Mode card')
    it('should display Editor Mode card')
    it('should switch to type selection on Auto Mode click')
    it('should navigate to /editor/niche on Editor Mode click')
    it('should show back button on type selection step')
    it('should navigate to /create on type selection')
})
```

### Test: Update videos page dropdown tests (if exists)
```tsx
describe('VideosPage CreateNew Dropdown', () => {
    it('should show mode selection options')
    it('should show Auto Mode with sub-menu')
    it('should show Editor Mode option')
    it('should navigate correctly on selection')
})
```

---

## Phase 3.7.5: E2E Tests (Playwright)

### Test: `e2e/tests/mode-selection.spec.ts`
```ts
test.describe('Mode Selection', () => {
    test('should display mode selection on dashboard for new users', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText('Auto Mode')).toBeVisible();
        await expect(page.getByText('Editor Mode')).toBeVisible();
    });

    test('should navigate to type selection on Auto Mode click', async ({ page }) => {
        await page.goto('/dashboard');
        await page.click('text=Auto Mode');
        await expect(page.getByText('Single Video')).toBeVisible();
        await expect(page.getByText('Create Series')).toBeVisible();
    });

    test('should navigate to editor niche on Editor Mode click', async ({ page }) => {
        await page.goto('/dashboard');
        await page.click('text=Editor Mode');
        await expect(page).toHaveURL(/.*editor\/niche/);
    });

    test('should show mode options in Create New dropdown', async ({ page }) => {
        await page.goto('/videos');
        await page.click('text=Create New');
        await expect(page.getByText('Auto Mode')).toBeVisible();
        await expect(page.getByText('Editor Mode')).toBeVisible();
    });
});
```

### Test: `e2e/tests/auto-mode-flow.spec.ts`
```ts
test.describe('Auto Mode Flow', () => {
    test('should complete full Auto Mode journey', async ({ page }) => {
        await page.goto('/dashboard');
        await page.click('text=Auto Mode');
        await page.click('text=Single Video');
        
        // Step 1: Niche
        await expect(page).toHaveURL(/.*create\/niche/);
        await page.click('[data-niche-id]'); // Select a niche
        await page.click('text=Continue');
        
        // Step 2: Script
        await expect(page).toHaveURL(/.*create\/script/);
        await page.fill('input[name="episodeTitle"]', 'Test Video');
        await page.fill('textarea', 'A story about testing');
        await page.click('text=Continue');
        
        // Step 3: Voice
        await expect(page).toHaveURL(/.*create\/voice/);
        await page.click('[data-voice-id]'); // Select a voice
        await page.click('text=Continue');
        
        // Step 4: Music
        await expect(page).toHaveURL(/.*create\/music/);
        await page.click('text=Continue');
        
        // Step 5: Subtitles
        await expect(page).toHaveURL(/.*create\/subtitles/);
        await page.click('[data-subtitle-template-id]');
        await page.click('text=Continue');
        
        // Step 6: Review
        await expect(page).toHaveURL(/.*create\/review/);
        await expect(page.getByText('Generate Video')).toBeVisible();
    });

    test('should not show editor mode toggle on script step', async ({ page }) => {
        await page.goto('/create/script?nicheId=test');
        await expect(page.getByText('Editor Mode')).not.toBeVisible();
    });
});
```

### Test: `e2e/tests/editor-mode-flow.spec.ts`
```ts
test.describe('Editor Mode Flow', () => {
    test('should navigate through all editor steps', async ({ page }) => {
        await page.goto('/editor/niche');
        
        // Step 1: Niche
        await page.click('[data-niche-id]');
        await page.click('text=Continue');
        
        // Step 2: Script
        await expect(page).toHaveURL(/.*editor\/script/);
        await page.fill('input[name="episodeTitle"]', 'Editor Test');
        await page.fill('textarea', 'A story for editor mode');
        await page.click('text=Generate Script');
        await page.waitForSelector('[data-testid="generated-script"]');
        await page.click('text=Accept Script');
        await page.click('text=Continue');
        
        // Step 3: Audio
        await expect(page).toHaveURL(/.*editor\/audio/);
        await page.click('text=Continue');
        
        // Step 4: Visuals
        await expect(page).toHaveURL(/.*editor\/visuals/);
        await expect(page.getByText('Image Gallery')).toBeVisible();
        await page.click('text=Continue');
        
        // Step 5: Subtitles
        await expect(page).toHaveURL(/.*editor\/subtitles/);
        await page.click('[data-subtitle-style-id]');
        await page.click('text=Continue');
        
        // Step 6: Review
        await expect(page).toHaveURL(/.*editor\/review/);
        await expect(page.getByText('Render Video')).toBeVisible();
    });

    test('should show image gallery with regenerate buttons', async ({ page }) => {
        await page.goto('/editor/visuals');
        await expect(page.getByText('Regenerate All')).toBeVisible();
        await expect(page.locator('[data-testid="segment-regenerate-btn"]').first()).toBeVisible();
    });

    test('should show edit links on review step', async ({ page }) => {
        await page.goto('/editor/review');
        await expect(page.getByText('Edit Script')).toBeVisible();
        await expect(page.getByText('Edit Audio')).toBeVisible();
        await expect(page.getByText('Edit Visuals')).toBeVisible();
    });
});
```

---

## Test Execution Commands

### Run Unit Tests
```bash
# Run all unit tests
cd webapp/client && npm test

# Run specific test file
npm test -- editor/__tests__/visuals-step.test.tsx

# Run tests in watch mode
npm test -- --watch
```

### Run E2E Tests
```bash
# Run all e2e tests
cd webapp/e2e && npx playwright test

# Run specific test file
npx playwright test mode-selection.spec.ts

# Run with UI mode
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed
```

---

## File Checklist

### Files to Create (10 new source files)
- [ ] `shared/steps/niche-step.tsx`
- [ ] `shared/steps/voice-step.tsx`
- [ ] `shared/steps/music-step.tsx`
- [ ] `editor/layout.tsx`
- [ ] `editor/context/editor-creation-context.tsx`
- [ ] `editor/steps/script-step.tsx`
- [ ] `editor/steps/audio-step.tsx`
- [ ] `editor/steps/visuals-step.tsx`
- [ ] `editor/steps/subtitles-step.tsx`
- [ ] `editor/steps/review-step.tsx`

### Files to Modify (7 source files)
- [ ] `onboarding-empty-state.tsx` - Add mode selection
- [ ] `videos/page.tsx` - Update dropdown
- [ ] `videos-empty-state.tsx` - Update dropdown
- [ ] `create/layout.tsx` - Remove editor mode logic
- [ ] `create/steps/script-step.tsx` - Remove toggle
- [ ] `create/context/creation-context.tsx` - Rename/refactor
- [ ] `App.tsx` (router) - Add editor routes

### Files to Delete (2 source files)
- [ ] `create/steps/script-editor-step.tsx` (merged into editor)
- [ ] Old context if fully replaced

### Test Files to Create (14 test files)
- [ ] `shared/__tests__/niche-step.test.tsx`
- [ ] `shared/__tests__/voice-step.test.tsx`
- [ ] `shared/__tests__/music-step.test.tsx`
- [ ] `editor/__tests__/editor-creation-context.test.tsx`
- [ ] `editor/__tests__/layout.test.tsx`
- [ ] `editor/__tests__/script-step.test.tsx`
- [ ] `editor/__tests__/audio-step.test.tsx`
- [ ] `editor/__tests__/visuals-step.test.tsx`
- [ ] `editor/__tests__/subtitles-step.test.tsx`
- [ ] `editor/__tests__/review-step.test.tsx`
- [ ] `components/__tests__/onboarding-empty-state.test.tsx`
- [ ] `e2e/tests/mode-selection.spec.ts`
- [ ] `e2e/tests/auto-mode-flow.spec.ts`
- [ ] `e2e/tests/editor-mode-flow.spec.ts`

### Test Files to Update (4 test files)
- [ ] `create/__tests__/editor-mode-workflow.test.tsx` → Move or delete
- [ ] `create/__tests__/layout-integration.test.tsx` → Remove editor mode tests
- [ ] `create/__tests__/script-step.test.tsx` → Remove toggle tests
- [ ] `create/__tests__/step-validation.test.ts` → Update to AutoJobRequest

---

## Implementation Order (Recommended)

1. **Phase 3.1** - Create shared folder and move components
2. **Phase 3.3** - Create Auto Mode context (minimal changes to existing)
3. **Phase 3.2** - Create Editor Mode structure (new code)
4. **Phase 3.5** - Update routing
5. **Phase 3.4** - Update entry points (UI changes)
6. **Phase 3.6** - Cleanup legacy code
7. **Phase 3.7** - Run all tests

### Testing Strategy Per Phase

| Phase | Tests to Run After |
|-------|-------------------|
| 3.1 | Shared step unit tests |
| 3.2 | Editor mode unit tests |
| 3.3 | Auto mode unit tests (ensure no regressions) |
| 3.4 | Mode selection unit tests |
| 3.5 | E2E navigation tests |
| 3.6 | Full regression suite |
| 3.7 | All unit tests + all E2E tests |

This order minimizes breaking changes and allows incremental testing at each phase.

