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
// SUBTITLE WORD - For word-level subtitle timing
// =============================================================================
export interface SubtitleWord {
    text: string
    start: number // frames at 30fps
    end: number   // frames at 30fps
}

// =============================================================================
// SCRIPT SEGMENT - For dialogue segments with timing
// =============================================================================
export interface ScriptSegment {
    dialogue: string
    start: number   // frames at 30fps
    end: number     // frames at 30fps
    duration: number // seconds
}

// =============================================================================
// AUDIO VERSION - For tracking multiple audio generations
// =============================================================================
export interface AudioVersion {
    id: string
    audioKey: string
    audioUrl: string
    durationSeconds: number
    voiceId: string
    voiceName: string
    tonePrompt?: string
    script: string // The script text used to generate this audio version
    subtitles?: SubtitleWord[] // Optional - generated separately via transcription step
    segments?: ScriptSegment[] // Optional - generated separately via segmentation step
    generatedAt: string
}

// =============================================================================
// VISUAL SEGMENT - For per-segment image control in Editor Mode
// =============================================================================
export interface VisualSegment {
    id: string
    index: number
    timeRange: [number, number] // [start, end] in seconds
    subtitleText: string
    imagePrompt: string
    imageKey?: string
    imageUrl?: string
    generatedAt?: string
    isGenerating?: boolean
    // Legacy fields for backward compatibility
    startTime?: number
    endTime?: number
    generatedImageUrl?: string
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
    
    // Video ID (set after first save)
    videoId?: string
    
    // Phase 1: Script
    approvedScript?: GeneratedScript
    scriptGenerationCount: number
    scriptFeedback?: string
    
    // Phase 2: Audio
    audioUrl?: string
    audioKey?: string
    audioDurationSeconds?: number
    tonePrompt?: string
    audioGenerationCount: number
    subtitles?: SubtitleWord[]
    audioVersions: AudioVersion[]  // List of all generated audio versions
    selectedAudioId?: string       // ID of the currently selected audio version
    
    // Phase 3: Visuals
    segments: VisualSegment[]
    imageGenerationStatus?: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED'
    
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
    videoId: undefined,
    approvedScript: undefined,
    scriptGenerationCount: 0,
    scriptFeedback: undefined,
    audioUrl: undefined,
    audioKey: undefined,
    audioDurationSeconds: undefined,
    tonePrompt: undefined,
    audioGenerationCount: 0,
    subtitles: undefined,
    audioVersions: [],
    selectedAudioId: undefined,
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
