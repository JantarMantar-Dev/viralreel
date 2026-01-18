import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
    ChevronLeft, 
    ChevronRight,
    Loader2,
    Image as ImageIcon
} from "lucide-react"
import { VisualSegment } from "../../context/editor-creation-context"
import { getSegmentImageUrl } from "../visuals/utils"
import { useState, useEffect, useRef } from "react"
import { SUBTITLE_STYLES } from "@/lib/subtitle-styles"
import { cn } from "@/lib/utils"

// Scaled container that maintains 1080x1920 coordinate system
const ScaledContainer = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parent = containerRef.current
                const availableWidth = parent.clientWidth
                const availableHeight = parent.clientHeight
                
                // Calculate scale to fit within the container (contain)
                const scaleX = availableWidth / 1080
                const scaleY = availableHeight / 1920
                const newScale = Math.min(scaleX, scaleY)
                
                setScale(newScale)
            }
        }

        const observer = new ResizeObserver(updateScale)
        if (containerRef.current) {
            observer.observe(containerRef.current)
            updateScale()
        }

        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className={cn("w-full h-full flex items-center justify-center overflow-hidden", className)}>
            <div style={{
                width: 1080,
                height: 1920,
                flexShrink: 0,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                position: 'relative',
            }}>
                {children}
            </div>
        </div>
    )
}

export function SubtitlePreviewDialog({ 
    open, 
    onOpenChange, 
    segments,
    subtitleStyleName,
    initialIndex = 0
}: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    segments: VisualSegment[]
    subtitleStyleName?: string
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
    
    // Get style config
    const styleConfig = Object.values(SUBTITLE_STYLES).find(s => s.name === subtitleStyleName)
    const subtitleStyle = styleConfig?.style || {}

    // Get preview text (first word)
    const previewText = currentSegment?.subtitleText 
        ? currentSegment.subtitleText.trim().split(/\s+/)[0] 
        : "Preview"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-slate-800 overflow-hidden">
                <div className="relative h-[80vh] flex items-center justify-center group bg-black/90">
                    
                    {/* Scaled Preview Area */}
                    <ScaledContainer>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={`Segment ${currentIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                <ImageIcon className="h-24 w-24 mb-4 opacity-50 text-slate-400" />
                            </div>
                        )}
                        
                        {/* Subtitle Overlay - Using absolute positioning within 1080x1920 frame */}
                        {subtitleStyleName && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',     // Center aligned vertically
                                alignItems: 'center',         // Center aligned horizontally
                            }}>
                                <div style={{
                                    textAlign: 'center',
                                    maxWidth: '85%',
                                    ...subtitleStyle
                                }}>
                                    {previewText}
                                </div>
                            </div>
                        )}
                    </ScaledContainer>
                    
                    {/* Navigation Overlay (Fixed on top of scaled content) */}
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end z-10">
                        <div className="text-white">
                            <p className="font-medium text-lg">Segment #{currentIndex + 1}</p>
                            <p className="text-white/60 text-sm">
                                Style: {subtitleStyleName || "None selected"}
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
