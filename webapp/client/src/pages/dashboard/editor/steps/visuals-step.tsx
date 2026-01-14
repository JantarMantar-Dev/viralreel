import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    Image,
    RefreshCw,
    Loader2,
    Sparkles,
    Clock,
    ChevronDown,
    ChevronUp,
    Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation, VisualSegment } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../../create/components/step-header"
import { API_BASE_URL } from "@/lib/config"

export default function EditorVisualsStep() {
    const { request, updateRequest } = useEditorCreation()
    const [expandedSegment, setExpandedSegment] = useState<string | null>(null)

    // Generate all images mutation
    const generateAllMutation = useMutation({
        mutationFn: async () => {
            if (!request.approvedScript) {
                throw new Error("No approved script available")
            }

            const response = await fetch(`${API_BASE_URL}/api/visuals/generate-all`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    script: request.approvedScript.story,
                    visualStyle: request.visualStyle,
                    nicheId: request.nicheId,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to generate visuals")
            }

            return response.json()
        },
        onSuccess: (data) => {
            updateRequest({ segments: data.segments })
            toast.success("All images generated successfully!")
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    // Regenerate single segment mutation
    const regenerateSegmentMutation = useMutation({
        mutationFn: async ({ segmentId, prompt }: { segmentId: string; prompt: string }) => {
            const response = await fetch(`${API_BASE_URL}/api/visuals/regenerate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    segmentId,
                    prompt,
                    visualStyle: request.visualStyle,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to regenerate image")
            }

            return response.json()
        },
        onSuccess: (data, variables) => {
            const updatedSegments = request.segments.map(seg =>
                seg.id === variables.segmentId
                    ? { ...seg, generatedImageUrl: data.imageUrl, isGenerating: false }
                    : seg
            )
            updateRequest({ segments: updatedSegments })
            toast.success("Image regenerated!")
        },
        onError: (error: Error, variables) => {
            const updatedSegments = request.segments.map(seg =>
                seg.id === variables.segmentId
                    ? { ...seg, isGenerating: false }
                    : seg
            )
            updateRequest({ segments: updatedSegments })
            toast.error(error.message)
        },
    })

    const handleRegenerateSegment = (segment: VisualSegment) => {
        const updatedSegments = request.segments.map(seg =>
            seg.id === segment.id ? { ...seg, isGenerating: true } : seg
        )
        updateRequest({ segments: updatedSegments })
        regenerateSegmentMutation.mutate({ segmentId: segment.id, prompt: segment.imagePrompt })
    }

    const updateSegmentPrompt = (segmentId: string, newPrompt: string) => {
        const updatedSegments = request.segments.map(seg =>
            seg.id === segmentId ? { ...seg, imagePrompt: newPrompt } : seg
        )
        updateRequest({ segments: updatedSegments })
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isGeneratingAll = generateAllMutation.isPending
    const hasSegments = request.segments.length > 0

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Visual Generation"
                description="Generate and customize the images for each segment of your video."
            />

            {/* Generate All Button / Gallery Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                            <Image className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Image Gallery</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                {hasSegments 
                                    ? `${request.segments.length} segments generated` 
                                    : "Generate images for all segments of your video"}
                            </p>
                        </div>
                    </div>
                    {hasSegments && (
                        <Button
                            variant="outline"
                            onClick={() => generateAllMutation.mutate()}
                            disabled={isGeneratingAll}
                            className="gap-2"
                        >
                            {isGeneratingAll ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Regenerate All
                        </Button>
                    )}
                </div>

                {!hasSegments ? (
                    <Button
                        onClick={() => generateAllMutation.mutate()}
                        disabled={isGeneratingAll}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl"
                    >
                        {isGeneratingAll ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating All Images...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                Generate All Images
                            </>
                        )}
                    </Button>
                ) : (
                    /* Image Gallery Strip */
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
                        {request.segments.map((segment, index) => (
                            <div
                                key={segment.id}
                                onClick={() => setExpandedSegment(expandedSegment === segment.id ? null : segment.id)}
                                className={cn(
                                    "relative flex-shrink-0 w-24 h-32 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                                    expandedSegment === segment.id
                                        ? "border-purple-600 ring-2 ring-purple-200"
                                        : "border-slate-200 hover:border-purple-300"
                                )}
                            >
                                {segment.generatedImageUrl ? (
                                    <img
                                        src={segment.generatedImageUrl}
                                        alt={`Segment ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                        {segment.isGenerating ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                        ) : (
                                            <Image className="h-6 w-6 text-slate-400" />
                                        )}
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                    <span className="text-white text-xs font-bold">#{index + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Segment Cards */}
            {hasSegments && (
                <div className="space-y-4">
                    {request.segments.map((segment, index) => {
                        const isExpanded = expandedSegment === segment.id

                        return (
                            <div
                                key={segment.id}
                                className={cn(
                                    "bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300",
                                    isExpanded ? "shadow-lg" : "shadow-sm"
                                )}
                            >
                                {/* Segment Header */}
                                <button
                                    onClick={() => setExpandedSegment(isExpanded ? null : segment.id)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                                        {segment.generatedImageUrl ? (
                                            <img
                                                src={segment.generatedImageUrl}
                                                alt={`Segment ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {segment.isGenerating ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                                                ) : (
                                                    <Image className="h-5 w-5 text-slate-400" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900">Segment {index + 1}</span>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1">
                                            {segment.subtitleText}
                                        </p>
                                    </div>

                                    {/* Expand Icon */}
                                    {isExpanded ? (
                                        <ChevronUp className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-slate-400" />
                                    )}
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        {/* Subtitle Text */}
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                                Subtitle Text
                                            </span>
                                            <p className="text-slate-700 font-medium">
                                                {segment.subtitleText}
                                            </p>
                                        </div>

                                        {/* Image Prompt */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Pencil className="h-3 w-3" />
                                                Image Prompt
                                            </label>
                                            <textarea
                                                value={segment.imagePrompt}
                                                onChange={(e) => updateSegmentPrompt(segment.id, e.target.value)}
                                                className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none resize-none transition-all text-sm"
                                                placeholder="Describe the image you want for this segment..."
                                            />
                                        </div>

                                        {/* Generated Image Preview */}
                                        {segment.generatedImageUrl && (
                                            <div className="rounded-xl overflow-hidden">
                                                <img
                                                    src={segment.generatedImageUrl}
                                                    alt={`Segment ${index + 1}`}
                                                    className="w-full h-64 object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Regenerate Button */}
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRegenerateSegment(segment)}
                                            disabled={segment.isGenerating}
                                            className="w-full h-10 gap-2 rounded-xl"
                                        >
                                            {segment.isGenerating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4" />
                                            )}
                                            Regenerate This Image
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
