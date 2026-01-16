import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    Play,
    Pause,
    RefreshCw,
    Loader2,
    Volume2,
    Mic,
    Check,
    MessageSquare,
    Clock,
    CheckCircle2,
    Trash2,
    FileText,
    AlertCircle,
    Save,
    Edit3,
    Scissors,
    Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation, AudioVersion, SubtitleWord, ScriptSegment } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../../create/components/step-header"
import { API_BASE_URL } from "@/lib/config"
import { useGenerateAudio, useCreateDraftVideo, useGenerateTranscription, useGenerateSegments, useSaveSegments } from "@/hooks/useEditorApi"

interface Voice {
    id: string
    name: string
    gender: string
    previewUrl: string
}

export default function EditorAudioStep() {
    const { request, updateRequest, setCanContinue, setCustomNext, nextStep } = useEditorCreation()
    const [tonePrompt, setTonePrompt] = useState(request.tonePrompt || "")
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>(request.voiceId)
    const voicePreviewRef = useRef<HTMLAudioElement | null>(null)
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
    
    // Audio version playback state
    const [playingVersionId, setPlayingVersionId] = useState<string | null>(null)
    const audioVersionRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

    // API hooks
    const generateAudioMutation = useGenerateAudio()
    const createDraftMutation = useCreateDraftVideo()
    const generateTranscriptionMutation = useGenerateTranscription()
    const generateSegmentsMutation = useGenerateSegments()
    const saveSegmentsMutation = useSaveSegments()

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
            }

            // Now generate audio with the videoId (subtitles are generated separately)
            const result = await generateAudioMutation.mutateAsync({
                videoId,
                script: request.approvedScript.story,
                voiceId: selectedVoiceId,
                tonePrompt: tonePrompt || undefined,
            })

            // Create the new AudioVersion with the URL from the response (no subtitles yet)
            const newVersion: AudioVersion = {
                id: result.audioId,
                audioKey: result.audioKey,
                audioUrl: result.audioUrl,
                durationSeconds: result.durationSeconds,
                voiceId: result.voiceId,
                voiceName: result.voiceName,
                tonePrompt: result.tonePrompt,
                // subtitles are NOT included - they will be generated via transcription step
                generatedAt: result.generatedAt,
            }

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

    // Select a version to use
    const handleSelectVersion = (version: AudioVersion) => {
        updateRequest({
            audioUrl: version.audioUrl,
            audioKey: version.audioKey,
            audioDurationSeconds: version.durationSeconds,
            subtitles: version.subtitles,
            selectedAudioId: version.id,
            voiceId: version.voiceId,
            voiceName: version.voiceName,
            tonePrompt: version.tonePrompt,
        })
        setTranscriptionError(null)
        toast.success(`Selected audio version from ${formatDate(version.generatedAt)}`)
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

            // Update the audio version with edited subtitles
            const updatedVersions = request.audioVersions.map(v => 
                v.id === selectedVersion.id 
                    ? { ...v, subtitles: editedSubtitles }
                    : v
            )

            updateRequest({
                subtitles: editedSubtitles,
                audioVersions: updatedVersions,
            })

            setHasUnsavedChanges(false)
            setIsEditingTranscription(false)
            setEditedSubtitles(null)
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
                scriptSegments: result.segments,
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

            // Update the audio version with edited segments
            const updatedVersions = request.audioVersions.map(v => 
                v.id === selectedVersion.id 
                    ? { ...v, segments: editedSegments }
                    : v
            )

            updateRequest({
                scriptSegments: editedSegments,
                audioVersions: updatedVersions,
            })

            setHasUnsavedSegmentChanges(false)
            setIsEditingSegments(false)
            setEditedSegments(null)
            toast.success("Segments saved!")
        } catch (error: any) {
            toast.error(error.message || "Failed to save segments")
        } finally {
            setIsSavingSegments(false)
        }
    }

    // Format time from frames to MM:SS
    const formatFrameTime = (frames: number) => {
        const seconds = frames / 30
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
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

    const handleVoiceSelect = (voiceId: string) => {
        setSelectedVoiceId(voiceId)
        updateRequest({ voiceId, voiceName: voices?.find(v => v.id === voiceId)?.name })
    }

    const playVoicePreview = (voice: Voice) => {
        if (playingVoiceId === voice.id) {
            voicePreviewRef.current?.pause()
            setPlayingVoiceId(null)
            return
        }

        if (voicePreviewRef.current) {
            voicePreviewRef.current.pause()
        }

        voicePreviewRef.current = new Audio(voice.previewUrl)
        voicePreviewRef.current.play()
        setPlayingVoiceId(voice.id)
        voicePreviewRef.current.onended = () => setPlayingVoiceId(null)
    }

    useEffect(() => {
        return () => {
            voicePreviewRef.current?.pause()
            // Cleanup all audio version refs
            audioVersionRefs.current.forEach(audio => audio.pause())
            audioVersionRefs.current.clear()
        }
    }, [])

    const isSynthesizing = generateAudioMutation.isPending || createDraftMutation.isPending
    const isTranscribing = generateTranscriptionMutation.isPending
    const isSegmenting = generateSegmentsMutation.isPending

    // Format duration for display
    const formatDuration = (seconds: number | undefined) => {
        if (!seconds) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Get the currently selected version
    const selectedVersion = request.audioVersions.find(v => v.id === request.selectedAudioId)
    const hasVersions = request.audioVersions.length > 0
    const selectedHasTranscription = selectedVersion?.subtitles && selectedVersion.subtitles.length > 0
    const selectedHasSegments = selectedVersion?.segments && selectedVersion.segments.length > 0
    const needsTranscription = selectedVersion && !selectedHasTranscription
    const needsSegmentation = selectedVersion && selectedHasTranscription && !selectedHasSegments

    // Control whether the user can continue to the next step
    // They can only continue if they have a selected audio version WITH transcription AND segments
    useEffect(() => {
        const canProceed = !!(selectedVersion && selectedHasTranscription && selectedHasSegments)
        setCanContinue(canProceed)
        
        // Cleanup: reset canContinue when leaving this step
        return () => {
            setCanContinue(true)
        }
    }, [selectedVersion, selectedHasTranscription, selectedHasSegments, setCanContinue])

    // Set up custom next handler to auto-save unsaved changes (transcription or segments)
    useEffect(() => {
        const shouldSaveTranscription = hasUnsavedChanges && editedSubtitles && selectedVersion && request.videoId
        const shouldSaveSegments = hasUnsavedSegmentChanges && editedSegments && selectedVersion && request.videoId

        if (shouldSaveTranscription || shouldSaveSegments) {
            // If there are unsaved changes, set a custom next that saves first
            setCustomNext(async () => {
                try {
                    // Save transcription if needed
                    if (shouldSaveTranscription) {
                        const response = await fetch(`${API_BASE_URL}/api/editor/audio/save-transcription`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                videoId: request.videoId,
                                audioId: selectedVersion!.id,
                                subtitles: editedSubtitles,
                            }),
                        })

                        if (response.ok) {
                            // Update context with saved subtitles locally to ensure state consistency
                             // (Actual update happens via re-fetch or manual state update below)
                        } else {
                            throw new Error("Failed to auto-save transcription")
                        }
                    }

                    // Save segments if needed
                    if (shouldSaveSegments) {
                         const response = await fetch(`${API_BASE_URL}/api/editor/audio/save-segments`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                videoId: request.videoId,
                                audioId: selectedVersion!.id,
                                segments: editedSegments,
                            }),
                        })

                        if (!response.ok) {
                            throw new Error("Failed to auto-save segments")
                        }
                    }
                    
                    // Update context with all saved changes
                    const updatedVersions = request.audioVersions.map(v => 
                        v.id === selectedVersion!.id 
                            ? { 
                                ...v, 
                                ...(shouldSaveTranscription ? { subtitles: editedSubtitles! } : {}),
                                ...(shouldSaveSegments ? { segments: editedSegments! } : {})
                              }
                            : v
                    )
                    
                    updateRequest({
                        ...(shouldSaveTranscription ? { subtitles: editedSubtitles! } : {}),
                        ...(shouldSaveSegments ? { scriptSegments: editedSegments! } : {}),
                        audioVersions: updatedVersions,
                    })

                    toast.success("Changes auto-saved")
                    
                    // Proceed to next step regardless
                    nextStep(true)

                } catch (error) {
                    console.error("Failed to auto-save:", error)
                    toast.error("Failed to save changes. Please save manually.")
                }
            })
        } else {
            // No unsaved changes, clear custom next
            setCustomNext(undefined)
        }

        return () => {
            setCustomNext(undefined)
        }
    }, [hasUnsavedChanges, editedSubtitles, hasUnsavedSegmentChanges, editedSegments, selectedVersion, request.videoId, request.audioVersions, setCustomNext, nextStep, updateRequest])

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            <StepHeader
                title="Audio Synthesis"
                description="Select a voice and optionally adjust the tone. Preview and regenerate until you're satisfied."
            />

            {/* Voice Selection */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <Mic className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Select Voice</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose the AI voice that will narrate your video.
                        </p>
                    </div>
                </div>

                {voicesLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                ) : (
                    <div className="relative">
                        {/* Scrollable voice container - shows ~2 rows with scroll */}
                        <div 
                            data-testid="voice-scroll-container"
                            className="max-h-[320px] overflow-y-auto scroll-smooth pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {voices?.map((voice) => {
                                    const isSelected = selectedVoiceId === voice.id
                                    const isPlayingThis = playingVoiceId === voice.id

                                    return (
                                        <div
                                            key={voice.id}
                                            data-testid={`voice-card-${voice.id}`}
                                            onClick={() => handleVoiceSelect(voice.id)}
                                            className={cn(
                                                "relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                                                isSelected
                                                    ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                                                    : "border-slate-100 bg-slate-50/50 hover:border-purple-200 hover:bg-white"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-3 right-3 bg-purple-600 text-white p-0.5 rounded-full z-10 shadow-md">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm",
                                                    voice.gender.toLowerCase() === 'female' 
                                                        ? "bg-orange-100 text-orange-600" 
                                                        : "bg-blue-100 text-blue-600"
                                                )}>
                                                    {voice.name.charAt(0)}
                                                </div>
                                                <div className="text-center">
                                                    <h4 className={cn(
                                                        "font-bold text-sm",
                                                        isSelected ? "text-purple-900" : "text-slate-700"
                                                    )}>
                                                        {voice.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">{voice.gender}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        playVoicePreview(voice)
                                                    }}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                        isPlayingThis 
                                                            ? "bg-purple-600 text-white" 
                                                            : "bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600"
                                                    )}
                                                >
                                                    {isPlayingThis ? (
                                                        <Pause className="h-3 w-3" />
                                                    ) : (
                                                        <Play className="h-3 w-3 ml-0.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Scroll indicator - shows when there are more voices */}
                        {voices && voices.length > 8 && (
                            <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                    </div>
                )}
            </div>

            {/* Tone Prompt */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Tone Adjustment (Optional)</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Describe how you want the voice to sound. Leave empty for default tone.
                        </p>
                    </div>
                </div>

                <textarea
                    value={tonePrompt}
                    onChange={(e) => setTonePrompt(e.target.value)}
                    placeholder="e.g., Speak with a sense of mystery and suspense, pause slightly before revealing key facts..."
                    className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-amber-50 focus:border-amber-400 outline-none resize-none transition-all text-sm leading-relaxed"
                    maxLength={500}
                />
                <div className="flex justify-end mt-2">
                    <span className="text-xs text-slate-400">{tonePrompt.length}/500</span>
                </div>
            </div>

            {/* Audio Versions List */}
            {hasVersions && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                            <Volume2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900">Generated Audio Versions</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                {request.audioVersions.length} version{request.audioVersions.length > 1 ? 's' : ''} generated. 
                                Click to play, or select the one you want to use.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {request.audioVersions.slice().reverse().map((version, index) => {
                            const isSelected = version.id === request.selectedAudioId
                            const isPlaying = playingVersionId === version.id
                            const versionNumber = request.audioVersions.length - index
                            const hasTranscription = version.subtitles && version.subtitles.length > 0
                            const hasSegments = version.segments && version.segments.length > 0
                            const isTranscribingThis = isTranscribing && generateTranscriptionMutation.variables?.audioId === version.id
                            const isSegmentingThis = isSegmenting && generateSegmentsMutation.variables?.audioId === version.id

                            return (
                                <div
                                    key={version.id}
                                    className={cn(
                                        "relative p-4 rounded-2xl border-2 transition-all duration-200",
                                        isSelected
                                            ? "border-green-500 bg-green-50/50 shadow-sm"
                                            : "border-slate-100 bg-slate-50/30 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Play/Pause Button */}
                                        <button
                                            onClick={() => handleVersionPlayPause(version)}
                                            className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0",
                                                isPlaying 
                                                    ? "bg-purple-600 text-white hover:bg-purple-700" 
                                                    : "bg-white text-purple-600 hover:bg-purple-50 border-2 border-purple-200"
                                            )}
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-5 w-5" />
                                            ) : (
                                                <Play className="h-5 w-5 ml-0.5" />
                                            )}
                                        </button>

                                        {/* Version Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-slate-900">
                                                    Version {versionNumber}
                                                </span>
                                                {isSelected && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Selected
                                                    </span>
                                                )}
                                                {hasTranscription ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                                        <FileText className="h-3 w-3" />
                                                        Transcribed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                                        <AlertCircle className="h-3 w-3" />
                                                        No transcription
                                                    </span>
                                                )}
                                                {hasSegments && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                                                        <Scissors className="h-3 w-3" />
                                                        Segmented
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDuration(version.durationSeconds)}
                                                </span>
                                                <span>
                                                    {version.voiceName}
                                                </span>
                                                {version.tonePrompt && (
                                                    <span className="truncate max-w-[150px]" title={version.tonePrompt}>
                                                        "{version.tonePrompt}"
                                                    </span>
                                                )}
                                                <span className="text-slate-400">
                                                    {formatDate(version.generatedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Select Button (only show if not already selected) */}
                                            {!isSelected && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSelectVersion(version)}
                                                    className="gap-1.5 rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Use This
                                                </Button>
                                            )}
                                            {/* Get Transcription Button (show for selected version without transcription) */}
                                            {isSelected && !hasTranscription && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleGenerateTranscription(version.id)}
                                                    disabled={isTranscribingThis}
                                                    className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {isTranscribingThis ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Transcribing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4" />
                                                            Get Transcription
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {/* Generate Segments Button (show for selected version with transcription but no segments) */}
                                            {isSelected && hasTranscription && !hasSegments && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleGenerateSegments(version.id)}
                                                    disabled={isSegmentingThis}
                                                    className="gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700"
                                                >
                                                    {isSegmentingThis ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Segmenting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Scissors className="h-4 w-4" />
                                                            Segment
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Audio Waveform Visualization (when playing) */}
                                    {isPlaying && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1 h-6">
                                                {Array.from({ length: 50 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1 rounded-full bg-purple-500 animate-pulse"
                                                        style={{
                                                            height: `${20 + Math.random() * 80}%`,
                                                            animationDelay: `${i * 30}ms`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Transcription Error Display */}
                    {transcriptionError && (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-800">Transcription Failed</h4>
                                    <p className="text-sm text-red-600 mt-1">{transcriptionError}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setTranscriptionError(null)
                                            if (selectedVersion) {
                                                handleGenerateTranscription(selectedVersion.id)
                                            }
                                        }}
                                        disabled={isTranscribing || !selectedVersion}
                                        className="mt-3 gap-1.5 rounded-lg border-red-200 text-red-700 hover:bg-red-100"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Retry Transcription
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transcription Required Notice */}
                    {needsTranscription && !transcriptionError && !isTranscribing && (
                        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-amber-800">Transcription Required</h4>
                                    <p className="text-sm text-amber-600 mt-1">
                                        Click "Get Transcription" on the selected audio version to generate word-level subtitles. 
                                        This is required before proceeding to the next step.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Segmentation Error Display */}
                    {segmentationError && (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-800">Segmentation Failed</h4>
                                    <p className="text-sm text-red-600 mt-1">{segmentationError}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSegmentationError(null)
                                            if (selectedVersion) {
                                                handleGenerateSegments(selectedVersion.id)
                                            }
                                        }}
                                        disabled={isSegmenting || !selectedVersion}
                                        className="mt-3 gap-1.5 rounded-lg border-red-200 text-red-700 hover:bg-red-100"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Retry Segmentation
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generate New Version Button */}
                    <div className="mt-6">
                        <Button
                            variant="outline"
                            onClick={handleSynthesizeAudio}
                            disabled={isSynthesizing || !selectedVoiceId}
                            className="w-full h-12 gap-2 rounded-xl border-2"
                        >
                            {isSynthesizing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Generate New Version
                        </Button>
                    </div>
                </div>
            )}

            {/* Transcription Viewer/Editor Section */}
            {selectedHasTranscription && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Transcription</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">
                                    {(editedSubtitles || selectedVersion?.subtitles || []).length} words detected. 
                                    {isEditingTranscription 
                                        ? " Click on any word to edit it." 
                                        : " Click Edit to modify any words."}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditingTranscription ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelEditing}
                                        disabled={isSavingTranscription}
                                        className="gap-1.5 rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveTranscription}
                                        disabled={isSavingTranscription || !hasUnsavedChanges}
                                        className="gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSavingTranscription ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleStartEditing}
                                    className="gap-1.5 rounded-lg"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Unsaved changes warning */}
                    {hasUnsavedChanges && (
                        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-amber-700">You have unsaved changes</span>
                        </div>
                    )}

                    {/* Word list */}
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-xl">
                        {(isEditingTranscription ? editedSubtitles : selectedVersion?.subtitles)?.map((word, index) => (
                            <div key={index} className="relative group">
                                {isEditingTranscription ? (
                                    <input
                                        type="text"
                                        value={word.text}
                                        onChange={(e) => handleEditWord(index, e.target.value)}
                                        className={cn(
                                            "px-2 py-1 rounded-lg text-sm font-medium border-2 outline-none transition-all",
                                            "bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                                            "min-w-[40px] max-w-[150px]"
                                        )}
                                        style={{ width: `${Math.max(40, word.text.length * 10)}px` }}
                                    />
                                ) : (
                                    <span className="inline-block px-2 py-1 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700">
                                        {word.text}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Timestamp info */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">
                            Word-level timestamps are preserved. Editing words will not affect timing.
                        </p>
                    </div>
                </div>
            )}

            {/* Segmentation Required CTA */}
            {needsSegmentation && !segmentationError && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                            <Scissors className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Next Step: Segmentation</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                Break down the script into visual scenes based on the audio timing.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-50 to-white border border-purple-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-purple-100 text-purple-600 flex items-center justify-center mb-4 shadow-sm">
                            <Layers className="h-8 w-8" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">
                            Ready to Create Scenes
                        </h4>
                        <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
                            The transcription is complete. Now we need to split the story into visual segments (scenes) to prepare for image generation.
                        </p>
                        <Button
                            onClick={() => selectedVersion && handleGenerateSegments(selectedVersion.id)}
                            disabled={isSegmenting}
                            size="lg"
                            className="h-14 px-8 text-base font-bold bg-purple-600 hover:bg-purple-700 gap-3 rounded-2xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isSegmenting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Analyzing Story...
                                </>
                            ) : (
                                <>
                                    <Scissors className="h-5 w-5" />
                                    Generate Segments
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Segmentation Viewer/Editor Section */}
            {selectedHasSegments && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Segments</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">
                                    {(editedSegments || selectedVersion?.segments || []).length} scenes identified. 
                                    {isEditingSegments 
                                        ? " Edit the dialogue for each segment." 
                                        : " Click Edit to modify segment dialogue."}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditingSegments ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelEditingSegments}
                                        disabled={isSavingSegments}
                                        className="gap-1.5 rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveSegments}
                                        disabled={isSavingSegments || !hasUnsavedSegmentChanges}
                                        className="gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700"
                                    >
                                        {isSavingSegments ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Save Segments
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleStartEditingSegments}
                                    className="gap-1.5 rounded-lg"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Unsaved changes warning */}
                    {hasUnsavedSegmentChanges && (
                        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-amber-700">You have unsaved changes</span>
                        </div>
                    )}

                    {/* Segments List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {(isEditingSegments ? editedSegments : selectedVersion?.segments)?.map((segment, index) => (
                            <div 
                                key={index} 
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                                                <Clock className="h-3 w-3" />
                                                {formatFrameTime(segment.start)} - {formatFrameTime(segment.end)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                ({segment.duration}s)
                                            </span>
                                        </div>
                                        
                                        {isEditingSegments ? (
                                            <textarea
                                                value={segment.dialogue}
                                                onChange={(e) => handleEditSegmentDialogue(index, e.target.value)}
                                                className="w-full p-3 rounded-lg border-2 border-purple-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none text-sm leading-relaxed resize-none bg-white transition-all"
                                                rows={Math.max(2, Math.ceil(segment.dialogue.length / 60))}
                                            />
                                        ) : (
                                            <p className="text-slate-700 text-sm leading-relaxed">
                                                {segment.dialogue}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Initial Generate Button (shown when no versions exist) */}
            {!hasVersions && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                            <Volume2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Audio Preview</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                Generate audio to preview how your video will sound
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSynthesizeAudio}
                        disabled={isSynthesizing || !selectedVoiceId}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl disabled:opacity-50"
                    >
                        {isSynthesizing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {createDraftMutation.isPending ? "Creating video..." : "Synthesizing Audio..."}
                            </>
                        ) : (
                            <>
                                <Volume2 className="h-5 w-5" />
                                Generate Audio
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
