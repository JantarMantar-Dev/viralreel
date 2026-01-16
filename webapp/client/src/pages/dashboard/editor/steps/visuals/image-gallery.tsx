import {
    Image,
    Loader2,
    Sparkles,
    Pencil,
    Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VisualSegment } from "../../context/editor-creation-context"
import { getSegmentImageUrl } from "./utils"

interface ImageGallerySectionProps {
    segments: VisualSegment[]
    expandedSegment: string | null
    onSegmentClick: (id: string) => void
    isGeneratingAll: boolean
    canAnalyze: boolean
    onGenerateAll: (skipConfirmation: boolean) => void
    onAnalyzeScript: () => void
    onOpenRegeneratePrompts: () => void
    isAnalyzePending: boolean
}

export function ImageGallerySection({
    segments,
    expandedSegment,
    onSegmentClick,
    isGeneratingAll,
    canAnalyze,
    onGenerateAll,
    onAnalyzeScript,
    onOpenRegeneratePrompts,
    isAnalyzePending
}: ImageGallerySectionProps) {
    const hasSegments = segments.length > 0

    return (
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
                                ? `${segments.length} segments generated` 
                                : "Generate images for all segments of your video"}
                        </p>
                    </div>
                </div>
                {hasSegments && (
                    <div className="flex gap-2">
                            <Button
                            variant="outline"
                            onClick={onOpenRegeneratePrompts}
                            disabled={isGeneratingAll || !canAnalyze}
                            className="gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Regenerate Prompts
                        </Button>
                        <Button
                            onClick={() => onGenerateAll(false)}
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
                        onClick={() => onGenerateAll(false)}
                        disabled={isGeneratingAll || !canAnalyze}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl"
                    >
                        {isGeneratingAll ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {isAnalyzePending ? "Analyzing Script..." : "Generating All Images..."}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                Generate All Images
                            </>
                        )}
                    </Button>
                    
                    {/* Option to analyze first without generating */}
                    <Button
                        variant="outline"
                        onClick={onAnalyzeScript}
                        disabled={isAnalyzePending || !canAnalyze}
                        className="w-full h-10 gap-2 rounded-xl text-sm"
                    >
                        {isAnalyzePending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Pencil className="h-4 w-4" />
                        )}
                        Analyze Script First (Edit Prompts Before Generating)
                    </Button>
                </div>
            ) : (
                /* Image Gallery Strip */
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                    {segments.map((segment, index) => (
                        <div
                            key={segment.id}
                            onClick={() => onSegmentClick(segment.id)}
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
    )
}
