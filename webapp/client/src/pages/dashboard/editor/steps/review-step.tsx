import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
    Pencil,
    Play,
    Pause,
    Wand2,
    FileText,
    Mic,
    Image,
    Type,
    Clock,
    Hash,
    Volume2,
    Ban,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import { IMAGE_STYLES } from "./script-step"
import { useSubmitRender } from "@/hooks/useEditorApi"

export default function EditorReviewStep() {
    const { request } = useEditorCreation()
    const navigate = useNavigate()
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const submitRenderMutation = useSubmitRender()

    const selectedImageStyle = IMAGE_STYLES.find(s => s.id === request.visualStyle)

    const handlePlayPauseAudio = () => {
        if (!audioRef.current || !request.audioUrl) return

        if (isPlayingAudio) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlayingAudio(!isPlayingAudio)
    }

    // Handle render submission
    const handleRenderVideo = async () => {
        if (!request.videoId) {
            toast.error("No video found. Please complete all steps first.")
            return
        }

        try {
            const result = await submitRenderMutation.mutateAsync({
                videoId: request.videoId,
            })

            toast.success(result.message || "Video rendering started!")
            navigate("/videos")
        } catch (error: any) {
            toast.error(error.message || "Failed to start rendering")
        }
    }

    // Calculate stats
    const wordCount = request.approvedScript?.wordCount || 0
    const segmentCount = request.segments.length
    const estimatedDuration = request.audioDurationSeconds || request.approvedScript?.estimatedDurationSeconds || 0

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Validation checks
    const hasScript = !!request.approvedScript
    const hasAudio = !!request.audioUrl
    const hasVisuals = request.segments.length > 0 && request.segments.some(s => s.imageUrl || s.generatedImageUrl)
    const hasVideoId = !!request.videoId

    const isReadyToRender = hasScript && hasAudio && hasVisuals && hasVideoId

    // Get segment images count
    const segmentsWithImages = request.segments.filter(s => s.imageUrl || s.generatedImageUrl).length

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8 pb-32">
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Review & Render</h1>
                <p className="text-slate-500 font-medium text-lg">
                    Review all your settings before rendering. Click "Edit" to make changes to any section.
                </p>
            </div>

            {/* Readiness Check */}
            {!isReadyToRender && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-900">Complete all steps before rendering</h4>
                        <ul className="text-sm text-amber-700 mt-2 space-y-1">
                            {!hasScript && <li>- Script needs to be generated and approved</li>}
                            {!hasAudio && <li>- Audio needs to be generated</li>}
                            {!hasVisuals && <li>- Visuals need to be generated ({segmentsWithImages}/{segmentCount} segments have images)</li>}
                        </ul>
                    </div>
                </div>
            )}

            {isReadyToRender && (
                <div className="bg-green-50 rounded-2xl border border-green-200 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-green-900">Ready to render!</h4>
                        <p className="text-sm text-green-700 mt-1">
                            All steps are complete. Click the "Render Video" button below to start processing.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                            <span className="text-lg font-bold text-slate-900">{formatDuration(estimatedDuration)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Words</span>
                            <span className="text-lg font-bold text-slate-900">{wordCount}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-50 text-green-600">
                            <Image className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Segments</span>
                            <span className="text-lg font-bold text-slate-900">{segmentsWithImages}/{segmentCount}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <Hash className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Style</span>
                            <span className="text-lg font-bold text-slate-900">{selectedImageStyle?.name || "Comic"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Details */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Video Details</h3>
                            <p className="text-sm font-semibold text-slate-400">Title, niche, and content</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" 
                        onClick={() => navigate("../script")}
                    >
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Video Title</span>
                        <span className="text-sm font-bold text-slate-900">{request.episodeTitle || "Untitled"}</span>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Niche</span>
                        <span className="text-sm font-bold text-slate-900">{request.nicheName || "Not selected"}</span>
                    </div>
                </div>
            </div>

            {/* Script Preview */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Approved Script</h3>
                            <p className="text-sm font-semibold text-slate-400">{wordCount} words</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" 
                        onClick={() => navigate("../script")}
                    >
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 max-h-[200px] overflow-y-auto">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {request.approvedScript?.story || "No script generated"}
                    </p>
                </div>
            </div>

            {/* Audio Preview */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                            <Mic className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Audio</h3>
                            <p className="text-sm font-semibold text-slate-400">
                                {request.voiceName || "No voice selected"}
                                {request.audioDurationSeconds && ` (${formatDuration(request.audioDurationSeconds)})`}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" 
                        onClick={() => navigate("../audio")}
                    >
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {request.audioUrl ? (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                        <button
                            onClick={handlePlayPauseAudio}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md",
                                isPlayingAudio 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-white text-purple-600 border-2 border-purple-200"
                            )}
                        >
                            {isPlayingAudio ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5 ml-0.5" />
                            )}
                        </button>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-slate-900">{request.voiceName}</span>
                            {request.tonePrompt && (
                                <p className="text-xs text-slate-500 mt-0.5">Tone: {request.tonePrompt}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 h-6">
                            {[0.4, 0.8, 0.3, 0.9, 0.5, 0.7, 0.6].map((h, i) => (
                                <div 
                                    key={i} 
                                    style={{ height: `${h * 100}%` }} 
                                    className={cn(
                                        "w-1 rounded-full",
                                        isPlayingAudio ? "bg-purple-400 animate-pulse" : "bg-slate-300"
                                    )} 
                                />
                            ))}
                        </div>
                        <audio
                            ref={audioRef}
                            src={request.audioUrl}
                            onEnded={() => setIsPlayingAudio(false)}
                        />
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <Volume2 className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-slate-500">No audio generated yet</span>
                    </div>
                )}
            </div>

            {/* Visual Gallery */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Image className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Visuals</h3>
                            <p className="text-sm font-semibold text-slate-400">{segmentsWithImages} of {segmentCount} segments</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" 
                        onClick={() => navigate("../visuals")}
                    >
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {request.segments.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                        {request.segments.map((segment, index) => {
                            const imageUrl = segment.imageUrl || segment.generatedImageUrl
                            return (
                                <div
                                    key={segment.id}
                                    className="relative flex-shrink-0 w-28 h-36 rounded-xl overflow-hidden border-2 border-slate-200"
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`Segment ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                            <Image className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                        <span className="text-white text-xs font-bold">#{index + 1}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <Image className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-slate-500">No visuals generated yet</span>
                    </div>
                )}
            </div>

            {/* Subtitle Style */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                            <Type className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Subtitles</h3>
                            <p className="text-sm font-semibold text-slate-400">
                                {request.subtitleStyleName || "Skipped"}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700" 
                        onClick={() => navigate("../subtitles")}
                    >
                        Edit <Pencil className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    {request.subtitleStyleId ? (
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 rounded-lg text-lg bg-slate-900 text-white font-bold">
                                {request.subtitleStyleName}
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">{request.subtitleStyleName}</h4>
                                <p className="text-xs font-semibold text-slate-400">Selected style</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-slate-400">
                            <Ban className="h-8 w-8" />
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Skipped Subtitles</h4>
                                <p className="text-xs font-semibold text-slate-400">No text overlays will be added</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Render Button - Fixed at bottom on mobile */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Ready to create your video?</h3>
                        <p className="text-slate-500 mt-1">
                            {isReadyToRender 
                                ? "All steps are complete. Click to start rendering."
                                : "Please complete all steps before rendering."}
                        </p>
                    </div>
                    <Button
                        onClick={handleRenderVideo}
                        disabled={!isReadyToRender || submitRenderMutation.isPending}
                        className={cn(
                            "h-14 px-8 rounded-xl text-lg font-bold gap-3 transition-all",
                            isReadyToRender
                                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-200 hover:scale-[1.02]"
                                : "bg-slate-300 text-slate-500 cursor-not-allowed"
                        )}
                    >
                        {submitRenderMutation.isPending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Starting Render...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-5 w-5" />
                                Render Video
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
