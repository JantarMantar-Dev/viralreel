import {
    Maximize2,
    Image as ImageIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VisualSegment } from "../../context/editor-creation-context"
import { getSegmentImageUrl } from "../visuals/utils"
import { SUBTITLE_STYLES } from "@/lib/subtitle-styles"
import { useRef, useEffect, useState } from "react"

// Component to scale the preview content to fit the container
const ScaledContent = ({ children, width = 1080, height = 1920 }: { children: React.ReactNode, width?: number, height?: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                // Calculate scale based on width to maintain aspect ratio
                setScale(containerWidth / width);
            }
        };

        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) {
            observer.observe(containerRef.current);
            updateScale(); // Initial calculation
        }

        return () => observer.disconnect();
    }, [width]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            <div style={{
                width: width,
                height: height,
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            }}>
                {children}
            </div>
        </div>
    );
};

interface SubtitlePreviewGalleryProps {
    segments: VisualSegment[]
    subtitleStyleName?: string
    onPreview: (index: number) => void
}

export function SubtitlePreviewGallery({
    segments,
    subtitleStyleName,
    onPreview
}: SubtitlePreviewGalleryProps) {
    const hasSegments = segments.length > 0
    
    // Get style config
    const styleConfig = Object.values(SUBTITLE_STYLES).find(s => s.name === subtitleStyleName)
    const subtitleStyle = styleConfig?.style || {}

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Live Preview Gallery</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            {subtitleStyleName || "Select a style"}
                        </p>
                    </div>
                </div>
            </div>

            {hasSegments ? (
                /* Image Gallery Strip */
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                    {segments.map((segment, index) => {
                         const imageUrl = getSegmentImageUrl(segment);
                         const previewText = segment.subtitleText 
                             ? segment.subtitleText.trim().split(/\s+/)[0] 
                             : "Preview";

                        return (
                            <div
                                key={segment.id}
                                onClick={() => onPreview(index)}
                                className="relative flex-shrink-0 w-32 aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 border-slate-200 hover:border-purple-300 group bg-slate-900"
                            >
                                <ScaledContent>
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`Segment ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <span className="text-slate-500 text-4xl">No Image</span>
                                        </div>
                                    )}

                                    {/* Subtitle Overlay - Centered */}
                                    {subtitleStyleName && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center', // Centered vertically
                                            alignItems: 'center', // Centered horizontally
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
                                </ScaledContent>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <div className="bg-black/50 p-1 rounded-full">
                                        <Maximize2 className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                                
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                    <span className="text-white text-[10px] font-bold">#{index + 1}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No segments available for preview.
                </div>
            )}
        </div>
    )
}
