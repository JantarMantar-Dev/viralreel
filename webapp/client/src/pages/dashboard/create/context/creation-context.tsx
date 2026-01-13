import { createContext, useContext, ReactNode } from "react"

export interface GeneratedScript {
    story: string
    wordCount: number
    estimatedDurationSeconds: number
}

export interface VideoJobRequest {
    jobType: "video" | "series"
    seriesId?: string // Optional: for adding episodes to existing series
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
    // Editor mode fields
    editorMode: boolean
    generatedScript?: GeneratedScript
    scriptGenerationCount: number // Track number of generation attempts (max 3)
    scriptFeedback?: string // User feedback for regeneration
}

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
