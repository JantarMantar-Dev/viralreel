import { createContext, useContext, ReactNode } from "react"

// =============================================================================
// GENERATED SCRIPT (shared between modes when viewing script)
// =============================================================================
export interface GeneratedScript {
    story: string
    wordCount: number
    estimatedDurationSeconds: number
}

// =============================================================================
// VIDEO JOB REQUEST - Unified type for creation context state
// Supports both simple mode and editor mode
// =============================================================================
export interface VideoJobRequest {
    jobType: "video" | "series"
    seriesId?: string
    seriesName: string
    episodeTitle: string
    nicheId: string | null
    nicheName?: string
    scriptIdea: string
    duration: number
    segments: number
    visualFormat: "image" | "video"
    voiceId?: string
    voiceName?: string
    visualStyle?: string
    subtitleTemplateId?: string
    subtitleTemplateName?: string
    musicId?: string
    musicName?: string
    musicDetails?: string
    aspectRatio: "portrait" | "landscape"
    isDraft: boolean
    // Mode selection
    editorMode: boolean
    // Editor mode specific fields (only used when editorMode is true)
    generatedScript?: GeneratedScript
    scriptGenerationCount: number // Track number of generation attempts (max 3)
    scriptFeedback?: string // User feedback for regeneration
}

// =============================================================================
// SIMPLE MODE REQUEST (for API submission - script idea only)
// =============================================================================
export interface SimpleJobRequest {
    jobType: "video" | "series"
    seriesId?: string
    seriesName?: string
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

// =============================================================================
// EDITOR MODE REQUEST (for API submission - pre-generated script)
// =============================================================================
export interface EditorJobRequest {
    jobType: "video" | "series"
    seriesId?: string
    seriesName?: string
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
    // Required for editor mode submission
    generatedScript: GeneratedScript
}

// =============================================================================
// TYPE GUARDS & HELPERS
// =============================================================================

/**
 * Check if the request is ready for editor mode submission
 * (has a valid generated script)
 */
export function isReadyForEditorSubmission(request: VideoJobRequest): boolean {
    return request.editorMode === true && 
           request.generatedScript !== undefined &&
           request.generatedScript.story.length > 0
}

/**
 * Convert VideoJobRequest to SimpleJobRequest for API submission
 */
export function toSimpleJobRequest(request: VideoJobRequest): SimpleJobRequest {
    return {
        jobType: request.jobType,
        seriesId: request.seriesId,
        seriesName: request.seriesName || undefined,
        episodeTitle: request.episodeTitle,
        nicheId: request.nicheId,
        scriptIdea: request.scriptIdea,
        duration: request.duration,
        segments: request.segments,
        visualFormat: request.visualFormat,
        voiceId: request.voiceId,
        visualStyle: request.visualStyle,
        subtitleTemplateId: request.subtitleTemplateId,
        musicId: request.musicId,
        aspectRatio: request.aspectRatio,
        isDraft: request.isDraft,
    }
}

/**
 * Convert VideoJobRequest to EditorJobRequest for API submission
 * Throws if generatedScript is not present
 */
export function toEditorJobRequest(request: VideoJobRequest): EditorJobRequest {
    if (!request.generatedScript) {
        throw new Error("Cannot convert to EditorJobRequest: generatedScript is required")
    }
    return {
        jobType: request.jobType,
        seriesId: request.seriesId,
        seriesName: request.seriesName || undefined,
        episodeTitle: request.episodeTitle,
        nicheId: request.nicheId,
        scriptIdea: request.scriptIdea,
        duration: request.duration,
        segments: request.segments,
        visualFormat: request.visualFormat,
        voiceId: request.voiceId,
        visualStyle: request.visualStyle,
        subtitleTemplateId: request.subtitleTemplateId,
        musicId: request.musicId,
        aspectRatio: request.aspectRatio,
        isDraft: request.isDraft,
        generatedScript: request.generatedScript,
    }
}

// =============================================================================
// CONTEXT
// =============================================================================
export interface CreationContextType {
    request: VideoJobRequest
    updateRequest: (data: Partial<VideoJobRequest>) => void
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

export const CreationContext = createContext<CreationContextType | null>(null)

export function useCreation() {
    const context = useContext(CreationContext)
    if (!context) throw new Error("useCreation must be used within a CreationProvider")
    return context
}

// =============================================================================
// INITIAL STATE
// =============================================================================
export const INITIAL_REQUEST: VideoJobRequest = {
    jobType: "series",
    seriesName: "",
    episodeTitle: "",
    nicheId: null,
    scriptIdea: "",
    duration: 0.5,
    segments: 3,
    visualFormat: "image",
    visualStyle: "comic",
    voiceId: undefined,
    musicId: undefined,
    subtitleTemplateId: undefined,
    aspectRatio: "portrait",
    isDraft: false,
    editorMode: false,
    generatedScript: undefined,
    scriptGenerationCount: 0,
    scriptFeedback: undefined
}
