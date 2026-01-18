import {
    Loader2,
    Image,
    Clock,
    ChevronDown,
    ChevronUp,
    Pencil,
    Maximize2,
    RefreshCw,
    Captions
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VisualSegment } from "../../context/editor-creation-context"
import { PromptEditor } from "./prompt-editor"
import { formatTime, getSegmentStartTime, getSegmentEndTime, getSegmentImageUrl } from "./utils"

interface SegmentCardProps {
    segment: VisualSegment
    index: number
    isExpanded: boolean
    onToggleExpand: () => void
    onUpdatePrompt: (newPrompt: string) => void
    onPreview: (url: string, prompt: string) => void
    onRegenerate: () => void
    hasVideoId: boolean
}

export function SegmentCard({
    segment,
    index,
    isExpanded,
    onToggleExpand,
    onUpdatePrompt,
    onPreview,
    onRegenerate,
    hasVideoId
}: SegmentCardProps) {
    const imageUrl = getSegmentImageUrl(segment)

    return (
        <div
            className={cn(
                "bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300",
                isExpanded ? "shadow-lg" : "shadow-sm"
            )}
        >
            {/* Segment Header */}
            <button
                onClick={onToggleExpand}
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
                        <div className="flex flex-col gap-6">
                                {/* Subtitle Text */}
                            <div className="space-y-2">
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <Captions className="h-3 w-3" />
                                    Subtitle Text
                                </span>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-slate-700 font-medium leading-relaxed">
                                        {segment.subtitleText}
                                    </p>
                                </div>
                            </div>

                            {/* Image Prompt */}
                            <div className="space-y-2 flex-1 flex flex-col">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <Pencil className="h-3 w-3" />
                                    Image Prompt
                                </label>
                                <div className="flex-1 flex flex-col">
                                    <PromptEditor
                                        initialPrompt={segment.imagePrompt}
                                        onSave={onUpdatePrompt}
                                        className="h-full"
                                    />
                                </div>
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
                                                onClick={() => onPreview(imageUrl, segment.imagePrompt)}
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
                                onClick={onRegenerate}
                                disabled={segment.isGenerating || !hasVideoId}
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
}
