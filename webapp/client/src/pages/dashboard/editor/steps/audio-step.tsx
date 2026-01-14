import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../../create/components/step-header"
import { API_BASE_URL } from "@/lib/config"

interface Voice {
    id: string
    name: string
    gender: string
    previewUrl: string
}

export default function EditorAudioStep() {
    const { request, updateRequest } = useEditorCreation()
    const [isPlaying, setIsPlaying] = useState(false)
    const [tonePrompt, setTonePrompt] = useState(request.tonePrompt || "")
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>(request.voiceId)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const voicePreviewRef = useRef<HTMLAudioElement | null>(null)
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

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

    // Audio synthesis mutation
    const synthesizeMutation = useMutation({
        mutationFn: async () => {
            if (!request.approvedScript) {
                throw new Error("No approved script available")
            }

            const response = await fetch(`${API_BASE_URL}/api/audio/synthesize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    script: request.approvedScript.story,
                    voiceId: selectedVoiceId,
                    tonePrompt: tonePrompt || undefined,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to synthesize audio")
            }

            return response.json()
        },
        onSuccess: (data) => {
            updateRequest({
                audioUrl: data.audioUrl,
                voiceId: selectedVoiceId,
                voiceName: voices?.find(v => v.id === selectedVoiceId)?.name,
                tonePrompt: tonePrompt || undefined,
            })
            toast.success("Audio synthesized successfully!")
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const handlePlayPause = () => {
        if (!audioRef.current || !request.audioUrl) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
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
        }
    }, [])

    const isSynthesizing = synthesizeMutation.isPending

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

            {/* Audio Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                        <Volume2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Audio Preview</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            {request.audioUrl 
                                ? "Listen to your synthesized audio" 
                                : "Generate audio to preview how your video will sound"}
                        </p>
                    </div>
                </div>

                {request.audioUrl ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePlayPause}
                                    className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
                                        isPlaying 
                                            ? "bg-purple-600 text-white hover:bg-purple-700" 
                                            : "bg-white text-purple-600 hover:bg-purple-50 border-2 border-purple-200"
                                    )}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-6 w-6" />
                                    ) : (
                                        <Play className="h-6 w-6 ml-1" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1 h-8">
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-1 rounded-full transition-all",
                                                    isPlaying ? "animate-pulse" : ""
                                                )}
                                                style={{
                                                    height: `${20 + Math.random() * 60}%`,
                                                    backgroundColor: isPlaying ? '#9333ea' : '#cbd5e1',
                                                    animationDelay: `${i * 50}ms`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <audio
                                ref={audioRef}
                                src={request.audioUrl}
                                onEnded={() => setIsPlaying(false)}
                            />
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => synthesizeMutation.mutate()}
                            disabled={isSynthesizing}
                            className="w-full h-12 gap-2 rounded-xl border-2"
                        >
                            {isSynthesizing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Regenerate Audio
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => synthesizeMutation.mutate()}
                        disabled={isSynthesizing || !selectedVoiceId}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl disabled:opacity-50"
                    >
                        {isSynthesizing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Synthesizing Audio...
                            </>
                        ) : (
                            <>
                                <Volume2 className="h-5 w-5" />
                                Generate Audio
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
