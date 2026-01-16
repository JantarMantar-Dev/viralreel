import { useState, useEffect } from "react"
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
    AlertCircle,
    Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation, VisualSegment } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import StepHeader from "../../create/components/step-header"
import { useAnalyzeVisuals, useGenerateSegmentImage, useGenerateAllImages, useUpdateSegmentPrompt } from "@/hooks/useEditorApi"
import { useQueryClient } from "@tanstack/react-query"

function PromptEditor({ initialPrompt, onSave }: { initialPrompt: string, onSave: (val: string) => void }) {
    const [prompt, setPrompt] = useState(initialPrompt)

    useEffect(() => {
        setPrompt(initialPrompt)
    }, [initialPrompt])

    return (
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onBlur={() => {
                if (prompt !== initialPrompt) {
                    onSave(prompt)
                }
            }}
            className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-purple-50 focus:border-purple-400 outline-none resize-none transition-all text-sm"
            placeholder="Describe the image you want for this segment..."
        />
    )
}

function RegeneratePromptsDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    isAnalyzing 
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isAnalyzing: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate Visual Prompts?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to regenerate all visual prompts? This will overwrite any manual edits you've made to the prompts.
                        <br /><br />
                        <strong>Note:</strong> Existing generated images will be preserved until you choose to regenerate them.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAnalyzing}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700">
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            "Regenerate Prompts"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ImagePreviewDialog({ 
    open, 
    onOpenChange, 
    imageUrl,
    prompt 
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    imageUrl?: string
    prompt: string
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/95 border-none">
                <div className="relative w-full h-[80vh] flex items-center justify-center">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt="Full preview" 
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-white/50 flex flex-col items-center">
                            <Image className="h-12 w-12 mb-2 opacity-50" />
                            <p>No image generated yet</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-black/50 backdrop-blur-sm absolute bottom-0 left-0 right-0">
                    <p className="text-white/90 text-sm font-medium line-clamp-2">
                        {prompt}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function EditorVisualsStep() {
    const { request, updateRequest } = useEditorCreation()
    const [expandedSegment, setExpandedSegment] = useState<string | null>(null)
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
    const [previewImage, setPreviewImage] = useState<{ url?: string, prompt: string } | null>(null)
    const queryClient = useQueryClient()

    // API hooks
    const analyzeVisualsMutation = useAnalyzeVisuals()
    const generateSegmentMutation = useGenerateSegmentImage()
    const generateAllMutation = useGenerateAllImages()
    const updatePromptMutation = useUpdateSegmentPrompt()

    // Check if we have required data
    const hasVideoId = !!request.videoId
    const hasAudio = !!request.audioUrl && !!request.audioDurationSeconds
    const canAnalyze = hasVideoId && hasAudio && request.approvedScript

    // Generate all images mutation handler
    const handleGenerateAll = async () => {
        if (!request.videoId) {
            toast.error("No video ID found. Please go back to the Audio step.")
            return
        }

        if (!request.approvedScript || !request.audioDurationSeconds) {
            toast.error("Missing required data. Please complete the Audio step first.")
            return
        }

        try {
            // If we don't have segments yet, analyze first
            if (request.segments.length === 0) {
                const analyzeResult = await analyzeVisualsMutation.mutateAsync({
                    videoId: request.videoId,
                    script: request.approvedScript.story,
                    audioDurationSeconds: request.audioDurationSeconds,
                })

                updateRequest({ segments: analyzeResult.segments })
            }

            // Now generate all images
            const result = await generateAllMutation.mutateAsync({
                videoId: request.videoId,
                style: request.visualStyle,
            })

            updateRequest({ segments: result.segments })
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("All images generated successfully!")
        } catch (error: any) {
            toast.error(error.message || "Failed to generate visuals")
        }
    }

    // Analyze script to get segments (without generating images)
    const handleAnalyzeScript = async () => {
        if (!request.videoId || !request.approvedScript || !request.audioDurationSeconds) {
            toast.error("Missing required data")
            return
        }

        try {
            const result = await analyzeVisualsMutation.mutateAsync({
                videoId: request.videoId,
                script: request.approvedScript.story,
                audioDurationSeconds: request.audioDurationSeconds,
            })

            updateRequest({ segments: result.segments })
            setShowRegenerateDialog(false)
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("Visual prompts generated successfully!")
        } catch (error: any) {
            toast.error(error.message || "Failed to analyze script")
        }
    }

    // Regenerate single segment
    const handleRegenerateSegment = async (segment: VisualSegment) => {
        if (!request.videoId) {
            toast.error("No video ID found")
            return
        }

        // Mark segment as generating
        const updatedSegments = request.segments.map(seg =>
            seg.id === segment.id ? { ...seg, isGenerating: true } : seg
        )
        updateRequest({ segments: updatedSegments })

        try {
            const result = await generateSegmentMutation.mutateAsync({
                videoId: request.videoId,
                segmentId: segment.id,
                prompt: segment.imagePrompt,
                style: request.visualStyle,
            })

            // Update segment with new image
            const finalSegments = request.segments.map(seg =>
                seg.id === segment.id
                    ? {
                        ...seg,
                        ...result.segment,
                        isGenerating: false,
                        generatedImageUrl: result.segment.imageUrl, // Legacy field
                    }
                    : seg
            )
            updateRequest({ segments: finalSegments })
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("Image regenerated!")
        } catch (error: any) {
            // Reset generating state
            const resetSegments = request.segments.map(seg =>
                seg.id === segment.id ? { ...seg, isGenerating: false } : seg
            )
            updateRequest({ segments: resetSegments })
            toast.error(error.message || "Failed to regenerate image")
        }
    }

    const updateSegmentPrompt = async (segmentId: string, newPrompt: string) => {
        // Optimistic update
        const updatedSegments = request.segments.map(seg =>
            seg.id === segmentId ? { ...seg, imagePrompt: newPrompt } : seg
        )
        updateRequest({ segments: updatedSegments })

        if (!request.videoId) return

        try {
            await updatePromptMutation.mutateAsync({
                videoId: request.videoId,
                segmentId,
                prompt: newPrompt
            })
            // No toast needed for auto-save unless error
        } catch (error) {
            console.error("Failed to save prompt:", error)
            toast.error("Failed to save prompt change")
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Get time from segment (handle both new and legacy format)
    const getSegmentStartTime = (segment: VisualSegment): number => {
        if (segment.timeRange) return segment.timeRange[0]
        return segment.startTime || 0
    }

    const getSegmentEndTime = (segment: VisualSegment): number => {
        if (segment.timeRange) return segment.timeRange[1]
        return segment.endTime || 0
    }

    // Get image URL (handle both new and legacy format)
    const getSegmentImageUrl = (segment: VisualSegment): string | undefined => {
        return segment.imageUrl || segment.generatedImageUrl
    }

    const isGeneratingAll = generateAllMutation.isPending || analyzeVisualsMutation.isPending
    const hasSegments = request.segments.length > 0

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Visual Generation"
                description="Generate and customize the images for each segment of your video."
            />

            {/* Warning if missing prerequisites */}
            {!canAnalyze && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-900">Complete previous steps first</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            {!hasVideoId && "No video created yet. "}
                            {!hasAudio && "Audio must be generated before creating visuals."}
                        </p>
                    </div>
                </div>
            )}

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
                        <div className="flex gap-2">
                             <Button
                                variant="outline"
                                onClick={() => setShowRegenerateDialog(true)}
                                disabled={isGeneratingAll || !canAnalyze}
                                className="gap-2"
                            >
                                <Pencil className="h-4 w-4" />
                                Regenerate Prompts
                            </Button>
                            <Button
                                onClick={handleGenerateAll}
                                disabled={isGeneratingAll || !canAnalyze}
                                className="gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                                {isGeneratingAll ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                Generate All Images
                            </Button>
                        </div>
                    )}
                </div>

                {!hasSegments ? (
                    <div className="space-y-3">
                        <Button
                            onClick={handleAnalyzeScript}
                            disabled={isGeneratingAll || !canAnalyze}
                            className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl"
                        >
                            {analyzeVisualsMutation.isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Analyzing Script...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    Generate Visual Prompts
                                </>
                            )}
                        </Button>
                        <p className="text-center text-sm text-slate-500">
                            First we'll analyze your script to create visual prompts. Then you can review them before generating images.
                        </p>
                    </div>
                ) : (
                    /* Image Gallery Strip */
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                        {request.segments.map((segment, index) => (
                            <div
                                key={segment.id}
                                onClick={() => setExpandedSegment(expandedSegment === segment.id ? null : segment.id)}
                                className={cn(
                                    "relative flex-shrink-0 w-24 h-32 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 group",
                                    expandedSegment === segment.id
                                        ? "border-purple-600 ring-2 ring-purple-200"
                                        : "border-slate-200 hover:border-purple-300"
                                )}
                            >
                                {getSegmentImageUrl(segment) ? (
                                    <img
                                        src={getSegmentImageUrl(segment)}
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
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex justify-between items-center">
                                    <span className="text-white text-xs font-bold">#{index + 1}</span>
                                    {getSegmentImageUrl(segment) && (
                                        <div className="bg-white/20 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Maximize2 className="h-3 w-3 text-white" />
                                        </div>
                                    )}
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
                        const imageUrl = getSegmentImageUrl(segment)

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
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 relative group">
                                        {imageUrl ? (
                                            <>
                                                <img
                                                    src={imageUrl}
                                                    alt={`Segment ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    {/* Optional overlay content */}
                                                </div>
                                            </>
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
                                                {formatTime(getSegmentStartTime(segment))} - {formatTime(getSegmentEndTime(segment))}
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
                                    <div className="border-t border-slate-100 p-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Left Column: Text & Prompt */}
                                            <div className="space-y-6">
                                                 {/* Subtitle Text */}
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                                        Subtitle Text
                                                    </span>
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                        <p className="text-slate-700 font-medium leading-relaxed">
                                                            {segment.subtitleText}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Image Prompt */}
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                        <Pencil className="h-3 w-3" />
                                                        Image Prompt
                                                    </label>
                                                    <PromptEditor
                                                        initialPrompt={segment.imagePrompt}
                                                        onSave={(newPrompt) => updateSegmentPrompt(segment.id, newPrompt)}
                                                    />
                                                    <p className="text-xs text-slate-400">
                                                        Edit the prompt to change how the image looks.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Column: Image Preview & Actions */}
                                            <div className="space-y-4">
                                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                                    Generated Visual
                                                </span>
                                                
                                                <div className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[9/16] max-h-[400px] mx-auto shadow-sm">
                                                    {imageUrl ? (
                                                        <>
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Segment ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <Button 
                                                                    variant="secondary" 
                                                                    size="sm"
                                                                    className="gap-2"
                                                                    onClick={() => setPreviewImage({ url: imageUrl, prompt: segment.imagePrompt })}
                                                                >
                                                                    <Maximize2 className="h-4 w-4" />
                                                                    Expand View
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                                            {segment.isGenerating ? (
                                                                <>
                                                                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
                                                                    <p className="text-sm font-medium text-purple-600">Generating Image...</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Image className="h-8 w-8 mb-2 opacity-50" />
                                                                    <p className="text-sm">No image generated yet</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleRegenerateSegment(segment)}
                                                    disabled={segment.isGenerating || !request.videoId}
                                                    className="w-full h-11 gap-2 rounded-xl border-slate-200 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all"
                                                >
                                                    {segment.isGenerating ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4" />
                                                    )}
                                                    {imageUrl ? "Regenerate This Image" : "Generate Image"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Dialogs */}
            <RegeneratePromptsDialog 
                open={showRegenerateDialog} 
                onOpenChange={setShowRegenerateDialog}
                onConfirm={handleAnalyzeScript}
                isAnalyzing={analyzeVisualsMutation.isPending}
            />

            <ImagePreviewDialog
                open={!!previewImage}
                onOpenChange={(open) => !open && setPreviewImage(null)}
                imageUrl={previewImage?.url}
                prompt={previewImage?.prompt || ""}
            />
        </div>
    )
}
