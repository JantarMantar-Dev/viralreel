import { useMutation, useQuery } from "@tanstack/react-query"
import { API_BASE_URL } from "@/lib/config"
import { VisualSegment, SubtitleWord, GeneratedScript, AudioVersion } from "@/pages/dashboard/editor/context/editor-creation-context"

// =============================================================================
// DRAFT VIDEO HOOK
// =============================================================================

interface CreateDraftVideoParams {
    nicheId: string | null
    nicheName?: string
    episodeTitle?: string
    scriptIdea?: string
    duration?: number
    visualStyle?: string
    approvedScript: GeneratedScript
}

interface CreateDraftVideoResult {
    success: boolean
    videoId: string
    message: string
}

export function useCreateDraftVideo() {
    return useMutation({
        mutationFn: async (params: CreateDraftVideoParams): Promise<CreateDraftVideoResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor-jobs/draft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to create draft video")
            }

            return response.json()
        },
    })
}

// =============================================================================
// AUDIO HOOKS
// =============================================================================

interface GenerateAudioParams {
    videoId: string
    script: string
    voiceId: string
    tonePrompt?: string
}

interface GenerateAudioResult {
    success: boolean
    audioId: string
    audioKey: string
    audioUrl: string
    durationSeconds: number
    voiceId: string
    voiceName: string
    tonePrompt?: string
    generatedAt: string
    audioVersions: AudioVersion[]
}

export function useGenerateAudio() {
    return useMutation({
        mutationFn: async (params: GenerateAudioParams): Promise<GenerateAudioResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor/audio/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to generate audio")
            }

            return response.json()
        },
    })
}

// =============================================================================
// TRANSCRIPTION HOOKS
// =============================================================================

interface GenerateTranscriptionParams {
    videoId: string
    audioId: string
}

interface GenerateTranscriptionResult {
    success: boolean
    audioId: string
    subtitles: SubtitleWord[]
    wordCount: number
}

export function useGenerateTranscription() {
    return useMutation({
        mutationFn: async (params: GenerateTranscriptionParams): Promise<GenerateTranscriptionResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor/audio/transcribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to generate transcription")
            }

            return response.json()
        },
    })
}

interface GetAudioUrlResult {
    success: boolean
    audioUrl: string
    durationSeconds: number
}

export function useGetAudioUrl(videoId: string | undefined) {
    return useQuery({
        queryKey: ["editor-audio", videoId],
        queryFn: async (): Promise<GetAudioUrlResult> => {
            if (!videoId) throw new Error("No video ID")
            
            const response = await fetch(`${API_BASE_URL}/api/editor/audio/${videoId}`, {
                credentials: "include",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to get audio URL")
            }

            return response.json()
        },
        enabled: !!videoId,
    })
}

// =============================================================================
// VISUALS HOOKS
// =============================================================================

interface AnalyzeVisualsParams {
    videoId: string
    script: string
    audioDurationSeconds: number
}

interface AnalyzeVisualsResult {
    success: boolean
    segments: VisualSegment[]
}

export function useAnalyzeVisuals() {
    return useMutation({
        mutationFn: async (params: AnalyzeVisualsParams): Promise<AnalyzeVisualsResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor/visuals/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to analyze visuals")
            }

            return response.json()
        },
    })
}

interface GenerateSegmentImageParams {
    videoId: string
    segmentId: string
    prompt: string
    style?: string
}

interface GenerateSegmentImageResult {
    success: boolean
    segment: VisualSegment
}

export function useGenerateSegmentImage() {
    return useMutation({
        mutationFn: async (params: GenerateSegmentImageParams): Promise<GenerateSegmentImageResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor/visuals/generate-segment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to generate segment image")
            }

            return response.json()
        },
    })
}

interface GenerateAllImagesParams {
    videoId: string
    style?: string
}

interface GenerateAllImagesResult {
    success: boolean
    segments: VisualSegment[]
}

export function useGenerateAllImages() {
    return useMutation({
        mutationFn: async (params: GenerateAllImagesParams): Promise<GenerateAllImagesResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor/visuals/generate-all`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to generate all images")
            }

            return response.json()
        },
    })
}

// =============================================================================
// RENDER HOOKS
// =============================================================================

interface SubmitRenderParams {
    videoId: string
}

interface SubmitRenderResult {
    success: boolean
    videoId: string
    renderJobId: string
    status: string
    message: string
}

export function useSubmitRender() {
    return useMutation({
        mutationFn: async (params: SubmitRenderParams): Promise<SubmitRenderResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor/render`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to submit render")
            }

            return response.json()
        },
    })
}

interface RenderStatusResult {
    success: boolean
    status: string
    progress: number
    error?: string
    outputUrl?: string
    compressedUrl?: string
}

export function useRenderStatus(videoId: string | undefined) {
    return useQuery({
        queryKey: ["render-status", videoId],
        queryFn: async (): Promise<RenderStatusResult> => {
            if (!videoId) throw new Error("No video ID")
            
            const response = await fetch(`${API_BASE_URL}/api/editor/render/${videoId}/status`, {
                credentials: "include",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to get render status")
            }

            return response.json()
        },
        enabled: !!videoId,
        refetchInterval: (data) => {
            // Poll every 5 seconds if render is in progress
            const status = data?.state?.data?.status
            if (status && !["COMPLETED", "FAILED", "NOT_SUBMITTED"].includes(status)) {
                return 5000
            }
            return false
        },
    })
}

// =============================================================================
// EDITOR VIDEO HOOKS (Load & Auto-Save)
// =============================================================================

export interface EditorVideoData {
    id: string
    title: string | null
    status: string
    mode: string
    createdAt: string
    updatedAt: string
    metadata: {
        currentPhase?: string
        episodeTitle?: string
        scriptIdea?: string
        duration?: number
        visualStyle?: string
        voiceId?: string
        voiceName?: string
        tonePrompt?: string
        subtitleStyleId?: string
        subtitleStyleName?: string
        musicId?: string
        musicName?: string
        approvedScript?: GeneratedScript
        segments?: VisualSegment[]
        subtitles?: SubtitleWord[]
    } | null
    niche: {
        id: string
        name: string
    } | null
    audioUrl: string | null
    audioDurationSeconds: number | null
    segments: VisualSegment[]
}

interface GetEditorVideoResult {
    success: boolean
    video: EditorVideoData
}

export function useEditorVideo(videoId: string | undefined) {
    return useQuery({
        queryKey: ["editor-video", videoId],
        queryFn: async (): Promise<GetEditorVideoResult> => {
            if (!videoId) throw new Error("No video ID")
            
            const response = await fetch(`${API_BASE_URL}/api/editor-jobs/${videoId}`, {
                credentials: "include",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to load editor video")
            }

            return response.json()
        },
        enabled: !!videoId,
        staleTime: 30000, // Consider data fresh for 30 seconds
    })
}

export interface UpdateVideoMetadataParams {
    videoId: string
    metadata: {
        currentPhase?: "script" | "audio" | "visuals" | "subtitles" | "review"
        episodeTitle?: string
        scriptIdea?: string
        duration?: number
        visualStyle?: string
        voiceId?: string
        voiceName?: string
        tonePrompt?: string
        subtitleStyleId?: string
        subtitleStyleName?: string
        musicId?: string
        musicName?: string
    }
}

interface UpdateVideoMetadataResult {
    success: boolean
    message: string
    updatedAt: string
}

export function useUpdateVideoMetadata() {
    return useMutation({
        mutationFn: async (params: UpdateVideoMetadataParams): Promise<UpdateVideoMetadataResult> => {
            const response = await fetch(`${API_BASE_URL}/api/editor-jobs/${params.videoId}/metadata`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(params.metadata),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || error.error || "Failed to update video metadata")
            }

            return response.json()
        },
    })
}
