import { createContext, useContext, ReactNode } from "react"

export interface VideoJobRequest {
    jobType: "video" | "series"
    seriesName: string
    episode1Title: string
    nicheId: string | null
    scriptIdea: string
    duration: number
    segments: number
    visualFormat: "image" | "video"
    voiceId?: string
    visualStyle?: string
    subtitleTemplateId?: string
    musicId?: string
}

export interface CreationContextType {
    request: VideoJobRequest
    updateRequest: (data: Partial<VideoJobRequest>) => void
    nextStep: () => void
    prevStep: () => void
    currentStep: number
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
    episode1Title: "",
    nicheId: null,
    scriptIdea: "",
    duration: 1,
    segments: 3,
    visualFormat: "image",
    visualStyle: "comic",
    voiceId: undefined,
    musicId: undefined,
    subtitleTemplateId: "classic-capcut"
}
