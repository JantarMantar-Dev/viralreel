import { createContext, useContext } from "react"

// =============================================================================
// SHARED CREATION CONTEXT INTERFACE
// Common interface that both Auto Mode and Editor Mode contexts implement.
// This allows shared step components to work with either mode.
// =============================================================================

export interface SharedCreationContext {
    // Niche selection
    nicheId: string | null
    nicheName?: string
    updateNicheId: (id: string | null, name?: string) => void

    // Voice selection
    voiceId?: string
    voiceName?: string
    updateVoiceId: (id: string | undefined, name?: string) => void

    // Music selection
    musicId?: string
    musicName?: string
    musicDetails?: string
    updateMusicId: (id: string | undefined, name?: string, details?: string) => void

    // Navigation
    nextStep: (bypassOverride?: boolean) => void
    prevStep: () => void
    currentStep: number

    // Job type for conditional rendering
    jobType: "video" | "series"

    // Script idea for display purposes
    scriptIdea: string

    // Custom navigation overrides
    customNext?: () => void
    setCustomNext: (action: (() => void) | undefined) => void
    customPrev?: () => void
    setCustomPrev: (action: (() => void) | undefined) => void

    // Continue button state
    canContinue: boolean
    setCanContinue: (value: boolean) => void

    // Loading state
    isStepLoading?: boolean
    setIsStepLoading: (value: boolean) => void
}

// =============================================================================
// SHARED CONTEXT
// This context is used by shared step components
// =============================================================================
export const SharedContext = createContext<SharedCreationContext | null>(null)

export function useSharedCreation(): SharedCreationContext {
    const context = useContext(SharedContext)
    if (!context) {
        throw new Error("useSharedCreation must be used within a SharedContext.Provider")
    }
    return context
}

// =============================================================================
// ADAPTER FUNCTIONS
// These help convert mode-specific contexts to the shared interface
// =============================================================================

/**
 * Creates a shared context value from the Auto mode context
 * Used in Auto Mode layout to provide shared interface to shared steps
 */
export function createSharedFromAutoContext(autoContext: {
    request: {
        nicheId: string | null
        nicheName?: string
        voiceId?: string
        voiceName?: string
        musicId?: string
        musicName?: string
        musicDetails?: string
        jobType: "video" | "series"
        scriptIdea: string
    }
    updateRequest: (data: Record<string, unknown>) => void
    nextStep: () => void
    prevStep: () => void
    currentStep: number
    customNext?: () => void
    setCustomNext: (action: (() => void) | undefined) => void
    customPrev?: () => void
    setCustomPrev: (action: (() => void) | undefined) => void
    canContinue: boolean
    setCanContinue: (value: boolean) => void
    isStepLoading?: boolean
    setIsStepLoading: (value: boolean) => void
}): SharedCreationContext {
    return {
        nicheId: autoContext.request.nicheId,
        nicheName: autoContext.request.nicheName,
        updateNicheId: (id, name) => autoContext.updateRequest({ nicheId: id, nicheName: name }),

        voiceId: autoContext.request.voiceId,
        voiceName: autoContext.request.voiceName,
        updateVoiceId: (id, name) => autoContext.updateRequest({ voiceId: id, voiceName: name }),

        musicId: autoContext.request.musicId,
        musicName: autoContext.request.musicName,
        musicDetails: autoContext.request.musicDetails,
        updateMusicId: (id, name, details) => autoContext.updateRequest({ musicId: id, musicName: name, musicDetails: details }),

        nextStep: autoContext.nextStep,
        prevStep: autoContext.prevStep,
        currentStep: autoContext.currentStep,

        jobType: autoContext.request.jobType,
        scriptIdea: autoContext.request.scriptIdea,

        customNext: autoContext.customNext,
        setCustomNext: autoContext.setCustomNext,
        customPrev: autoContext.customPrev,
        setCustomPrev: autoContext.setCustomPrev,

        canContinue: autoContext.canContinue,
        setCanContinue: autoContext.setCanContinue,

        isStepLoading: autoContext.isStepLoading,
        setIsStepLoading: autoContext.setIsStepLoading,
    }
}

/**
 * Creates a shared context value from the Editor mode context
 * Used in Editor Mode layout to provide shared interface to shared steps
 */
export function createSharedFromEditorContext(editorContext: {
    request: {
        nicheId: string | null
        nicheName?: string
        voiceId?: string
        voiceName?: string
        musicId?: string
        musicName?: string
        musicDetails?: string
        scriptIdea: string
    }
    updateRequest: (data: Record<string, unknown>) => void
    nextStep: () => void
    prevStep: () => void
    currentStep: number
    customNext?: () => void
    setCustomNext: (action: (() => void) | undefined) => void
    customPrev?: () => void
    setCustomPrev: (action: (() => void) | undefined) => void
    canContinue: boolean
    setCanContinue: (value: boolean) => void
    isStepLoading?: boolean
    setIsStepLoading: (value: boolean) => void
}): SharedCreationContext {
    return {
        nicheId: editorContext.request.nicheId,
        nicheName: editorContext.request.nicheName,
        updateNicheId: (id, name) => editorContext.updateRequest({ nicheId: id, nicheName: name }),

        voiceId: editorContext.request.voiceId,
        voiceName: editorContext.request.voiceName,
        updateVoiceId: (id, name) => editorContext.updateRequest({ voiceId: id, voiceName: name }),

        musicId: editorContext.request.musicId,
        musicName: editorContext.request.musicName,
        musicDetails: editorContext.request.musicDetails,
        updateMusicId: (id, name, details) => editorContext.updateRequest({ musicId: id, musicName: name, musicDetails: details }),

        nextStep: editorContext.nextStep,
        prevStep: editorContext.prevStep,
        currentStep: editorContext.currentStep,

        // Editor mode is always single video
        jobType: "video",
        scriptIdea: editorContext.request.scriptIdea,

        customNext: editorContext.customNext,
        setCustomNext: editorContext.setCustomNext,
        customPrev: editorContext.customPrev,
        setCustomPrev: editorContext.setCustomPrev,

        canContinue: editorContext.canContinue,
        setCanContinue: editorContext.setCanContinue,

        isStepLoading: editorContext.isStepLoading,
        setIsStepLoading: editorContext.setIsStepLoading,
    }
}
