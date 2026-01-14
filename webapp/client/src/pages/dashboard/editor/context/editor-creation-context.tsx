import { createContext, useContext } from "react"

// =============================================================================
// GENERATED SCRIPT
// =============================================================================
export interface GeneratedScript {
    story: string
    wordCount: number
    estimatedDurationSeconds: number
}

// =============================================================================
// VISUAL SEGMENT - For per-segment image control in Editor Mode
// =============================================================================
export interface VisualSegment {
    id: string
    startTime: number
    endTime: number
    subtitleText: string
    imagePrompt: string
    generatedImageUrl?: string
    isGenerating?: boolean
}

// =============================================================================
// EDITOR MODE REQUEST - Full type for Editor Mode creation
// =============================================================================
export interface EditorModeRequest {
    // Base fields
    jobType: "video"  // Editor mode is always single video
    episodeTitle: string
    nicheId: string | null
    nicheName?: string
    scriptIdea: string
    duration: number
    visualFormat: "image"  // Editor mode always uses images
    voiceId?: string
    voiceName?: string
    visualStyle?: string
    aspectRatio: "portrait"  // Fixed for now
    
    // Phase 1: Script
    approvedScript?: GeneratedScript
    scriptGenerationCount: number
    scriptFeedback?: string
    
    // Phase 2: Audio
    audioUrl?: string
    tonePrompt?: string
    
    // Phase 3: Visuals
    segments: VisualSegment[]
    
    // Phase 4: Subtitles
    subtitleStyleId?: string
    subtitleStyleName?: string
    
    // Phase 5: Review
    isDraft: boolean
    
    // Music (optional, same as auto mode)
    musicId?: string
    musicName?: string
    musicDetails?: string
}

// =============================================================================
// EDITOR JOB REQUEST - For API submission
// =============================================================================
export interface EditorJobRequest {
    jobType: "video"
    episodeTitle: string
    nicheId: string | null
    scriptIdea: string
    duration: number
    visualFormat: "image"
    voiceId?: string
    visualStyle?: string
    subtitleStyleId?: string
    musicId?: string
    aspectRatio: "portrait"
    isDraft: boolean
    // Required for editor mode submission
    approvedScript: GeneratedScript
    segments: VisualSegment[]
    audioUrl?: string
}

// =============================================================================
// CONTEXT TYPE
// =============================================================================
export interface EditorCreationContextType {
    request: EditorModeRequest
    updateRequest: (data: Partial<EditorModeRequest>) => void
    nextStep: (bypassOverride?: boolean) => void
    prevStep: () => void
    currentStep: number
    // Custom overrides for footer buttons
    customNext?: () => void
    setCustomNext: (action: (() => void) | undefined) => void
    customPrev?: () => void
    setCustomPrev: (action: (() => void) | undefined) => void
    canContinue: boolean
    setCanContinue: (value: boolean) => void
    isStepLoading?: boolean
    setIsStepLoading: (value: boolean) => void
}

export const EditorCreationContext = createContext<EditorCreationContextType | null>(null)

export function useEditorCreation(): EditorCreationContextType {
    const context = useContext(EditorCreationContext)
    if (!context) {
        throw new Error("useEditorCreation must be used within an EditorCreationContext.Provider")
    }
    return context
}

// =============================================================================
// INITIAL STATE
// =============================================================================
export const INITIAL_EDITOR_REQUEST: EditorModeRequest = {
    jobType: "video",
    episodeTitle: "",
    nicheId: null,
    nicheName: undefined,
    scriptIdea: "",
    duration: 0.5,
    visualFormat: "image",
    visualStyle: "comic",
    voiceId: undefined,
    voiceName: undefined,
    aspectRatio: "portrait",
    approvedScript: undefined,
    scriptGenerationCount: 0,
    scriptFeedback: undefined,
    audioUrl: undefined,
    tonePrompt: undefined,
    segments: [],
    subtitleStyleId: undefined,
    subtitleStyleName: undefined,
    isDraft: false,
    musicId: undefined,
    musicName: undefined,
    musicDetails: undefined,
}

// =============================================================================
// TYPE GUARDS & HELPERS
// =============================================================================

/**
 * Check if the request is ready for submission
 * (has a valid approved script)
 */
export function isReadyForEditorSubmission(request: EditorModeRequest): boolean {
    return request.approvedScript !== undefined &&
           request.approvedScript.story.length > 0
}

/**
 * Convert EditorModeRequest to EditorJobRequest for API submission
 */
export function toEditorJobRequest(request: EditorModeRequest): EditorJobRequest {
    if (!request.approvedScript) {
        throw new Error("Cannot convert to EditorJobRequest: approvedScript is required")
    }
    return {
        jobType: request.jobType,
        episodeTitle: request.episodeTitle,
        nicheId: request.nicheId,
        scriptIdea: request.scriptIdea,
        duration: request.duration,
        visualFormat: request.visualFormat,
        voiceId: request.voiceId,
        visualStyle: request.visualStyle,
        subtitleStyleId: request.subtitleStyleId,
        musicId: request.musicId,
        aspectRatio: request.aspectRatio,
        isDraft: request.isDraft,
        approvedScript: request.approvedScript,
        segments: request.segments,
        audioUrl: request.audioUrl,
    }
}
