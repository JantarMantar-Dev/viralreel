import { useState, useRef, useEffect } from "react"
import { Check, Mic, Play, Pause, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Voice {
    id: string
    name: string
    gender: string
    previewUrl: string
}

interface VoiceSelectorProps {
    voices: Voice[] | undefined
    isLoading: boolean
    selectedVoiceId: string | undefined
    onSelect: (voiceId: string) => void
}

export function VoiceSelector({ 
    voices, 
    isLoading, 
    selectedVoiceId, 
    onSelect 
}: VoiceSelectorProps) {
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
    const voicePreviewRef = useRef<HTMLAudioElement | null>(null)

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

    return (
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

            {isLoading ? (
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
                                        onClick={() => onSelect(voice.id)}
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
    )
}
