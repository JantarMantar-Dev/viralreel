import { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useEditorCreation, AudioVersion, SubtitleWord, ScriptSegment, VisualSegment } from "../context/editor-creation-context"
import StepHeader from "../../create/components/step-header"
import { API_BASE_URL } from "@/lib/config"
import { useGenerateAudio, useCreateDraftVideo, useGenerateTranscription, useGenerateSegments, useSaveSegments, useUpdateVideoMetadata } from "@/hooks/useEditorApi"

// Import sub-components
import { VoiceSelector, Voice } from "./audio/voice-selector"
import { ToneAdjuster } from "./audio/tone-adjuster"
import { AudioVersionList } from "./audio/audio-version-list"
import { TranscriptionEditor } from "./audio/transcription-editor"
import { SegmentEditor } from "./audio/segment-editor"
import { SegmentationPrompt } from "./audio/segmentation-prompt"
import { InitialAudioGenerator } from "./audio/initial-audio-generator"

// Helper to convert ScriptSegment to VisualSegment
const convertToVisualSegments = (scriptSegments: ScriptSegment[]): VisualSegment[] => {
    return scriptSegments.map((seg, index) => ({
        id: crypto.randomUUID(),
        index,
        timeRange: [seg.start / 30, seg.end / 30], // Convert frames to seconds
        subtitleText: seg.dialogue,
        imagePrompt: "", // Empty prompt, needs generation
        isGenerating: false
    }))
}

export default function EditorAudioStep() {
    const { request, updateRequest, setCanContinue } = useEditorCreation()
    const queryClient = useQueryClient()
    const [tonePrompt, setTonePrompt] = useState(request.tonePrompt || "")
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>(request.voiceId)
    
    // Audio version playback state
    const [playingVersionId, setPlayingVersionId] = useState<string | null>(null)
    const audioVersionRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

    // API hooks
    const generateAudioMutation = useGenerateAudio()
    const createDraftMutation = useCreateDraftVideo()
    const generateTranscriptionMutation = useGenerateTranscription()
    const generateSegmentsMutation = useGenerateSegments()
    const saveSegmentsMutation = useSaveSegments()
    const updateMetadataMutation = useUpdateVideoMetadata()

    // Transcription error state
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null)

    // Transcription editing state
    const [editedSubtitles, setEditedSubtitles] = useState<SubtitleWord[] | null>(null)
    const [isEditingTranscription, setIsEditingTranscription] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isSavingTranscription, setIsSavingTranscription] = useState(false)

    // Segmentation state
    const [segmentationError, setSegmentationError] = useState<string | null>(null)
    const [editedSegments, setEditedSegments] = useState<ScriptSegment[] | null>(null)
    const [isEditingSegments, setIsEditingSegments] = useState(false)
    const [hasUnsavedSegmentChanges, setHasUnsavedSegmentChanges] = useState(false)
    const [isSavingSegments, setIsSavingSegments] = useState(false)

    // Fetch available voices
    const { data: voices, isLoading: voicesLoading } = useQuery({
        queryKey: ["voices"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/voices`, {
                credentials: "include",
            })
            if (!res.ok) throw new Error("Failed to fetch voices")
            return res.json() as Promise<Voice[]>
        },
    })

    // Handle audio synthesis with the new API
    const handleSynthesizeAudio = async () => {
        if (!request.approvedScript) {
            toast.error("No approved script available")
            return
        }

        if (!selectedVoiceId) {
            toast.error("Please select a voice")
            return
        }

        try {
            let videoId = request.videoId

            // If we don't have a videoId yet, create a draft video first
            if (!videoId) {
                const draftResult = await createDraftMutation.mutateAsync({
                    nicheId: request.nicheId,
                    nicheName: request.nicheName,
                    episodeTitle: request.episodeTitle,
                    scriptIdea: request.scriptIdea,
                    duration: request.duration,
                    visualStyle: request.visualStyle,
                    approvedScript: request.approvedScript,
                })
                
                videoId = draftResult.videoId
                updateRequest({ videoId })
                
                // Update URL with videoId to persist state if page is reloaded
                const newSearchParams = new URLSearchParams(window.location.search)
                newSearchParams.set("videoId", videoId)
                window.history.replaceState(null, "", `${window.location.pathname}?${newSearchParams.toString()}`)
            }

            // Now generate audio with the videoId (subtitles are generated separately)
            const result = await generateAudioMutation.mutateAsync({
                videoId,
                script: request.approvedScript.story,
                voiceId: selectedVoiceId,
                tonePrompt: tonePrompt || undefined,
            })

            // Update context with all the audio data (no subtitles yet)
            updateRequest({
                audioUrl: result.audioUrl,
                audioKey: result.audioKey,
                audioDurationSeconds: result.durationSeconds,
                voiceId: selectedVoiceId,
                voiceName: voices?.find(v => v.id === selectedVoiceId)?.name,
                tonePrompt: tonePrompt || undefined,
                // subtitles will be set after transcription step
                audioGenerationCount: (request.audioGenerationCount || 0) + 1,
                audioVersions: result.audioVersions.map(v => ({
                    ...v,
                    // Ensure audioUrl is present (backend may not include it)
                    audioUrl: v.audioUrl || (v.id === result.audioId ? result.audioUrl : v.audioUrl),
                })),
                selectedAudioId: result.audioId,
            })

            // Clear any previous transcription error
            setTranscriptionError(null)

            toast.success("Audio synthesized! Select and finalize to generate transcription.")
        } catch (error: any) {
            toast.error(error.message || "Failed to synthesize audio")
        }
    }

    // Get signed URL for an audio key (if audioUrl is not cached)
    const getSignedUrl = async (audioKey: string): Promise<string | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/storage/signed-url?key=${encodeURIComponent(audioKey)}`, {
                credentials: "include",
            })
            if (!res.ok) return null
            const data = await res.json()
            return data.url
        } catch {
            return null
        }
    }

    // Handle playing/pausing a specific audio version
    const handleVersionPlayPause = async (version: AudioVersion) => {
        // If this version is currently playing, pause it
        if (playingVersionId === version.id) {
            const audio = audioVersionRefs.current.get(version.id)
            audio?.pause()
            setPlayingVersionId(null)
            return
        }

        // Pause any currently playing audio
        if (playingVersionId) {
            const currentAudio = audioVersionRefs.current.get(playingVersionId)
            currentAudio?.pause()
        }

        // Get or create audio element for this version
        let audio = audioVersionRefs.current.get(version.id)
        if (!audio) {
            // Use the stored audioUrl, or fetch a fresh signed URL if needed
            const audioUrl = version.audioUrl || await getSignedUrl(version.audioKey)
            if (!audioUrl) {
                toast.error("Could not load audio")
                return
            }
            audio = new Audio(audioUrl)
            audio.onended = () => setPlayingVersionId(null)
            audio.onerror = () => {
                toast.error("Error playing audio")
                setPlayingVersionId(null)
            }
            audioVersionRefs.current.set(version.id, audio)
        }

        await audio.play()
        setPlayingVersionId(version.id)
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Select a version to use - immediately saves to DB so navigation works correctly
    const handleSelectVersion = async (version: AudioVersion) => {
        const updateData: Partial<any> = {
            audioUrl: version.audioUrl,
            audioKey: version.audioKey,
            audioDurationSeconds: version.durationSeconds,
            subtitles: version.subtitles,
            // Convert script segments to visual segments if they exist
            segments: version.segments ? convertToVisualSegments(version.segments) : [],
            selectedAudioId: version.id,
            voiceId: version.voiceId,
            voiceName: version.voiceName,
            tonePrompt: version.tonePrompt,
        }
        
        // Optimistically update local state
        updateRequest(updateData)
        
        setTranscriptionError(null)
        toast.success(`Selected audio version from ${formatDate(version.generatedAt)}`)
        
        // Immediately save selectedAudioId to DB so navigation to next page works
        if (request.videoId) {
            try {
                await updateMetadataMutation.mutateAsync({
                    videoId: request.videoId,
                    metadata: { selectedAudioId: version.id }
                })
            } catch (error) {
                console.error("Failed to save audio selection:", error)
                // Don't show error toast - the local state is already updated
                // and auto-save will retry
            }
        }
    }

    // Generate transcription for the selected audio version
    const handleGenerateTranscription = async (audioId: string) => {
        if (!request.videoId) {
            toast.error("No video ID available")
            return
        }

        setTranscriptionError(null)

        try {
            const result = await generateTranscriptionMutation.mutateAsync({
                videoId: request.videoId,
                audioId,
            })

            // Update the audio version with subtitles
            const updatedVersions = request.audioVersions.map(v => 
                v.id === audioId 
                    ? { ...v, subtitles: result.subtitles }
                    : v
            )

            // Update context with transcription
            updateRequest({
                subtitles: result.subtitles,
                audioVersions: updatedVersions,
            })

            toast.success(`Transcription generated! ${result.wordCount} words detected.`)
        } catch (error: any) {
            const errorMessage = error.message || "Failed to generate transcription"
            setTranscriptionError(errorMessage)
            toast.error(errorMessage)
        }
    }

    // Handle editing a word in the transcription
    const handleEditWord = (index: number, newText: string) => {
        const currentSubtitles = editedSubtitles || selectedVersion?.subtitles || []
        const updated = [...currentSubtitles]
        updated[index] = { ...updated[index], text: newText }
        setEditedSubtitles(updated)
        setHasUnsavedChanges(true)
    }

    // Start editing transcription
    const handleStartEditing = () => {
        setEditedSubtitles(selectedVersion?.subtitles || [])
        setIsEditingTranscription(true)
    }

    // Cancel editing
    const handleCancelEditing = () => {
        setEditedSubtitles(null)
        setIsEditingTranscription(false)
        setHasUnsavedChanges(false)
    }

    // Save edited transcription
    const handleSaveTranscription = async () => {
        if (!request.videoId || !selectedVersion || !editedSubtitles) {
            return
        }

        setIsSavingTranscription(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/editor/audio/save-transcription`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    videoId: request.videoId,
                    audioId: selectedVersion.id,
                    subtitles: editedSubtitles,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to save transcription")
            }

            // Capture the saved subtitles before clearing state
            const savedSubtitles = editedSubtitles

            // Update the audio version with edited subtitles
            const updatedVersions = request.audioVersions.map(v => 
                v.id === selectedVersion.id 
                    ? { ...v, subtitles: savedSubtitles }
                    : v
            )

            // Clear editing state first, then update context
            // This ensures UI shows saved data from context, not stale editedSubtitles
            setHasUnsavedChanges(false)
            setIsEditingTranscription(false)
            setEditedSubtitles(null)

            // Update context with new data
            updateRequest({
                subtitles: savedSubtitles,
                audioVersions: updatedVersions,
            })

            // Invalidate the editor-video cache so fresh data is fetched on next navigation
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })

            toast.success("Transcription saved!")
        } catch (error: any) {
            toast.error(error.message || "Failed to save transcription")
        } finally {
            setIsSavingTranscription(false)
        }
    }

    // =============================================================================
    // SEGMENTATION HANDLERS
    // =============================================================================

    // Generate segments for the selected audio version
    const handleGenerateSegments = async (audioId: string) => {
        if (!request.videoId) {
            toast.error("No video ID available")
            return
        }

        setSegmentationError(null)

        try {
            const result = await generateSegmentsMutation.mutateAsync({
                videoId: request.videoId,
                audioId,
            })

            // Update the audio version with segments
            const updatedVersions = request.audioVersions.map(v => 
                v.id === audioId 
                    ? { ...v, segments: result.segments }
                    : v
            )

            // Update context with segments
            updateRequest({
                // Convert to visual segments
                segments: convertToVisualSegments(result.segments),
                audioVersions: updatedVersions,
            })

            toast.success(`Segmentation complete! ${result.segmentCount} segments created.`)
        } catch (error: any) {
            const errorMessage = error.message || "Failed to generate segments"
            setSegmentationError(errorMessage)
            toast.error(errorMessage)
        }
    }

    // Handle editing a segment's dialogue
    const handleEditSegmentDialogue = (index: number, newDialogue: string) => {
        const currentSegments = editedSegments || selectedVersion?.segments || []
        const updated = [...currentSegments]
        updated[index] = { ...updated[index], dialogue: newDialogue }
        setEditedSegments(updated)
        setHasUnsavedSegmentChanges(true)
    }

    // Start editing segments
    const handleStartEditingSegments = () => {
        setEditedSegments(selectedVersion?.segments || [])
        setIsEditingSegments(true)
    }

    // Cancel editing segments
    const handleCancelEditingSegments = () => {
        setEditedSegments(null)
        setIsEditingSegments(false)
        setHasUnsavedSegmentChanges(false)
    }

    // Save edited segments
    const handleSaveSegments = async () => {
        if (!request.videoId || !selectedVersion || !editedSegments) {
            return
        }

        setIsSavingSegments(true)

        try {
            await saveSegmentsMutation.mutateAsync({
                videoId: request.videoId,
                audioId: selectedVersion.id,
                segments: editedSegments,
            })

            // Capture the saved segments before clearing state
            const savedSegments = editedSegments

            // Update the audio version with edited segments
            const updatedVersions = request.audioVersions.map(v => 
                v.id === selectedVersion.id 
                    ? { ...v, segments: savedSegments }
                    : v
            )

            // Clear editing state first, then update context
            setHasUnsavedSegmentChanges(false)
            setIsEditingSegments(false)
            setEditedSegments(null)

            // Update context with new data
            updateRequest({
                // Convert to visual segments
                segments: convertToVisualSegments(savedSegments),
                audioVersions: updatedVersions,
            })

            // Invalidate the editor-video cache so fresh data is fetched on next navigation
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })

            toast.success("Segments saved!")
        } catch (error: any) {
            toast.error(error.message || "Failed to save segments")
        } finally {
            setIsSavingSegments(false)
        }
    }

    const handleVoiceSelect = (voiceId: string) => {
        setSelectedVoiceId(voiceId)
        updateRequest({ voiceId, voiceName: voices?.find(v => v.id === voiceId)?.name })
    }

    useEffect(() => {
        return () => {
            // Cleanup all audio version refs
            audioVersionRefs.current.forEach(audio => audio.pause())
            audioVersionRefs.current.clear()
        }
    }, [])

    const isSynthesizing = generateAudioMutation.isPending || createDraftMutation.isPending
    const isTranscribing = generateTranscriptionMutation.isPending
    const isSegmenting = generateSegmentsMutation.isPending

    // Get the currently selected version
    const selectedVersion = request.audioVersions.find(v => v.id === request.selectedAudioId)
    const hasVersions = request.audioVersions.length > 0
    const selectedHasTranscription = selectedVersion?.subtitles && selectedVersion.subtitles.length > 0
    const selectedHasSegments = selectedVersion?.segments && selectedVersion.segments.length > 0
    const needsSegmentation = selectedVersion && selectedHasTranscription && !selectedHasSegments

    // Control whether the user can continue to the next step
    // Block if: no audio selected, no transcription, no segments, OR unsaved changes
    // Note: Cleanup is in a separate effect to avoid running on every dependency change
    useEffect(() => {
        const hasRequiredData = !!(selectedVersion && selectedHasTranscription && selectedHasSegments)
        const hasNoUnsavedWork = !hasUnsavedChanges && !hasUnsavedSegmentChanges
        const canProceed = hasRequiredData && hasNoUnsavedWork
        setCanContinue(canProceed)
    }, [selectedVersion, selectedHasTranscription, selectedHasSegments, hasUnsavedChanges, hasUnsavedSegmentChanges, setCanContinue])

    // Reset canContinue only on unmount to avoid circular dependency
    useEffect(() => {
        return () => {
            setCanContinue(true)
        }
    }, [setCanContinue])

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            <StepHeader
                title="Audio Synthesis"
                description="Select a voice and optionally adjust the tone. Preview and regenerate until you're satisfied."
            />

            <VoiceSelector 
                voices={voices}
                isLoading={voicesLoading}
                selectedVoiceId={selectedVoiceId}
                onSelect={handleVoiceSelect}
            />

            <ToneAdjuster 
                tonePrompt={tonePrompt} 
                onChange={setTonePrompt} 
            />

            {hasVersions && (
                <AudioVersionList
                    versions={request.audioVersions}
                    selectedId={request.selectedAudioId}
                    playingVersionId={playingVersionId}
                    onPlayPause={handleVersionPlayPause}
                    onSelect={handleSelectVersion}
                    onGenerateTranscription={handleGenerateTranscription}
                    onGenerateSegments={handleGenerateSegments}
                    onSynthesizeAudio={handleSynthesizeAudio}
                    isSynthesizing={isSynthesizing}
                    isTranscribing={isTranscribing}
                    isSegmenting={isSegmenting}
                    transcribingAudioId={generateTranscriptionMutation.variables?.audioId}
                    segmentingAudioId={generateSegmentsMutation.variables?.audioId}
                    transcriptionError={transcriptionError}
                    segmentationError={segmentationError}
                    onRetryTranscription={() => selectedVersion && handleGenerateTranscription(selectedVersion.id)}
                    onRetrySegmentation={() => selectedVersion && handleGenerateSegments(selectedVersion.id)}
                    selectedVoiceId={selectedVoiceId}
                />
            )}

            {selectedHasTranscription && (
                <TranscriptionEditor
                    subtitles={isEditingTranscription && editedSubtitles ? editedSubtitles : (selectedVersion?.subtitles || [])}
                    isEditing={isEditingTranscription}
                    isSaving={isSavingTranscription}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onStartEditing={handleStartEditing}
                    onCancelEditing={handleCancelEditing}
                    onSave={handleSaveTranscription}
                    onEditWord={handleEditWord}
                />
            )}

            {needsSegmentation && !segmentationError && (
                <SegmentationPrompt
                    isSegmenting={isSegmenting}
                    onGenerate={() => selectedVersion && handleGenerateSegments(selectedVersion.id)}
                />
            )}

            {selectedHasSegments && (
                <SegmentEditor
                    segments={isEditingSegments && editedSegments ? editedSegments : (selectedVersion?.segments || [])}
                    isEditing={isEditingSegments}
                    isSaving={isSavingSegments}
                    hasUnsavedChanges={hasUnsavedSegmentChanges}
                    onStartEditing={handleStartEditingSegments}
                    onCancelEditing={handleCancelEditingSegments}
                    onSave={handleSaveSegments}
                    onEditDialogue={handleEditSegmentDialogue}
                />
            )}

            {!hasVersions && (
                <InitialAudioGenerator
                    isSynthesizing={isSynthesizing}
                    isCreatingDraft={createDraftMutation.isPending}
                    hasSelectedVoice={!!selectedVoiceId}
                    onGenerate={handleSynthesizeAudio}
                />
            )}
        </div>
    )
}
