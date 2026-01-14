import { createContext, useContext, ReactNode } from "react"

// =============================================================================
// GENERATED SCRIPT (used by Editor Mode only, kept here for type exports)
// =============================================================================
export interface GeneratedScript {
    story: string
    wordCount: number
    estimatedDurationSeconds: number
}

// =============================================================================
// AUTO JOB REQUEST - Type for Auto Mode (clean, no editor fields)
// =============================================================================
export interface AutoJobRequest {
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
}

// =============================================================================
// VIDEO JOB REQUEST - Alias for AutoJobRequest (for backward compatibility)
// =============================================================================
export type VideoJobRequest = AutoJobRequest

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
// Note: This is also defined in editor-creation-context.tsx for Editor Mode
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
}
