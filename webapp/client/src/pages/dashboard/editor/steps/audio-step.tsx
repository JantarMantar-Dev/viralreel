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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation, AudioVersion } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../../create/components/step-header"
import { API_BASE_URL } from "@/lib/config"
import { useGenerateAudio, useCreateDraftVideo } from "@/hooks/useEditorApi"

interface Voice {
    id: string
    name: string
    gender: string
    previewUrl: string
}

export default function EditorAudioStep() {
    const { request, updateRequest } = useEditorCreation()
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

            // Now generate audio with the videoId
            const result = await generateAudioMutation.mutateAsync({
                videoId,
                script: request.approvedScript.story,
                voiceId: selectedVoiceId,
                tonePrompt: tonePrompt || undefined,
            })

            // Create the new AudioVersion with the URL from the response
            const newVersion: AudioVersion = {
                id: result.audioId,
                audioKey: result.audioKey,
                audioUrl: result.audioUrl,
                durationSeconds: result.durationSeconds,
                voiceId: result.voiceId,
                voiceName: result.voiceName,
                tonePrompt: result.tonePrompt,
                subtitles: result.subtitles,
                generatedAt: result.generatedAt,
            }

            // Update context with all the audio data
            updateRequest({
                audioUrl: result.audioUrl,
                audioKey: result.audioKey,
                audioDurationSeconds: result.durationSeconds,
                voiceId: selectedVoiceId,
                voiceName: voices?.find(v => v.id === selectedVoiceId)?.name,
                tonePrompt: tonePrompt || undefined,
                subtitles: result.subtitles,
                audioGenerationCount: (request.audioGenerationCount || 0) + 1,
                audioVersions: result.audioVersions.map(v => ({
                    ...v,
                    // Ensure audioUrl is present (backend may not include it)
                    audioUrl: v.audioUrl || (v.id === result.audioId ? result.audioUrl : v.audioUrl),
                })),
                selectedAudioId: result.audioId,
            })

            toast.success("Audio synthesized successfully!")
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
        toast.success(`Selected audio version from ${formatDate(version.generatedAt)}`)
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
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900">
                                                    Version {versionNumber}
                                                </span>
                                                {isSelected && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Selected
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

                                        {/* Select Button (only show if not already selected) */}
                                        {!isSelected && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSelectVersion(version)}
                                                className="flex-shrink-0 gap-1.5 rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                            >
                                                <Check className="h-4 w-4" />
                                                Use This
                                            </Button>
                                        )}
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
