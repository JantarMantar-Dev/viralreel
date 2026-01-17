import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
    Loader2, 
    Image, 
    ChevronLeft, 
    ChevronRight,
    X 
} from "lucide-react"
import { VisualSegment } from "../../context/editor-creation-context"
import { getSegmentImageUrl } from "./utils"
import { useState, useEffect } from "react"


export function RegeneratePromptsDialog({ 
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
                            "Generate Visual Prompts"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function RegenerateImagesDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    isGenerating,
    count
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isGenerating: boolean
    count: number
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate All Images?</DialogTitle>
                    <DialogDescription>
                        You already have {count} generated images. Regenerating all images will overwrite them and cost additional credits.
                        <br /><br />
                        Are you sure you want to proceed?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Yes, Regenerate All"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ImagePreviewDialog({ 
    open, 
    onOpenChange, 
    segments,
    initialIndex = 0
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    segments: VisualSegment[]
    initialIndex?: number
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    // Reset index when dialog opens with a new initialIndex
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex)
        }
    }, [open, initialIndex])

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % segments.length)
    }

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + segments.length) % segments.length)
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return
            if (e.key === 'ArrowRight') nextImage()
            if (e.key === 'ArrowLeft') prevImage()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, segments.length])

    if (!segments || segments.length === 0) return null
    
    const currentSegment = segments[currentIndex]
    const imageUrl = currentSegment ? getSegmentImageUrl(currentSegment) : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-slate-800 overflow-hidden">
                <div className="relative h-[80vh] flex items-center justify-center group">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`Segment ${currentIndex + 1}`}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <div className="text-white/50 flex flex-col items-center">
                            {currentSegment?.isGenerating ? (
                                <Loader2 className="h-12 w-12 mb-2 animate-spin text-purple-500" />
                            ) : (
                                <Image className="h-12 w-12 mb-2 opacity-50" />
                            )}
                            <p>{currentSegment?.isGenerating ? "Generating..." : "No image generated yet"}</p>
                        </div>
                    )}
                    
                    {/* Navigation Overlay */}
                    {segments.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={prevImage}
                                className="pointer-events-auto h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={nextImage}
                                className="pointer-events-auto h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                        <div className="text-white">
                            <p className="font-medium text-lg">Segment #{currentIndex + 1}</p>
                            <p className="text-white/60 text-sm line-clamp-2 max-w-2xl">
                                {currentSegment?.imagePrompt || "No prompt available"}
                            </p>
                        </div>
                        <div className="text-white/60 text-sm">
                            {currentIndex + 1} / {segments.length}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

