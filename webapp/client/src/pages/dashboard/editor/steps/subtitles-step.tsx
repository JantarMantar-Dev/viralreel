import { cn } from "@/lib/utils"
import { useEditorCreation } from "../context/editor-creation-context"
import StepHeader from "../../create/components/step-header"
import { Check, Ban, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { API_BASE_URL } from "@/lib/config"
import { SubtitlePreviewGallery } from "./subtitles/subtitle-preview-gallery"
import { SubtitlePreviewDialog } from "./subtitles/subtitle-preview-dialog"
import { useState } from "react"

export interface SubtitleStyle {
    id: string
    name: string
    description: string
    preview: string
    css: string
}

const STYLE_MAPPING: Record<string, string> = {
    // Standard Styles
    "Classic CapCut": "font-sans font-black text-white stroke-black drop-shadow-[0_2px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-tight leading-none",
    "Bold Impact": "font-sans font-black text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-normal",
    "Neon Glow": "font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase text-4xl tracking-widest",
    "Minimal Clean": "font-sans font-medium text-slate-900 bg-white/90 px-3 py-1 rounded-lg text-2xl tracking-wide lowercase",
    "Gradient Pop": "font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm uppercase text-4xl tracking-tighter",
    "Comic Book": "font-sans font-extrabold text-white text-4xl tracking-wide uppercase drop-shadow-[3px_3px_0_#000] -rotate-3",
    "Typewriter": "font-mono font-medium text-green-400 bg-black/80 px-4 py-2 rounded-sm text-xl tracking-tight",
    "MrBeast Style": "font-sans font-black text-white text-5xl tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] stroke-[3px] stroke-black",
    "Karaoke": "font-sans font-bold text-purple-300 text-3xl tracking-normal capitalize drop-shadow-md",

    // Custom/New Styles
    "Default": "font-sans font-bold text-white drop-shadow-md text-3xl",
    "Bold Yellow": "font-sans font-black text-yellow-400 drop-shadow-md uppercase text-3xl",
    "Red Outline": "font-sans font-black text-transparent [-webkit-text-stroke:2px_red] uppercase text-3xl"
}

const PREVIEW_MAPPING: Record<string, string> = {
    "Default": "Basic",
    "Bold Yellow": "BOLD",
    "Red Outline": "Outline"
}

export default function EditorSubtitlesStep() {
    const { request, updateRequest } = useEditorCreation()
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)

    const { data: subtitleStyles, isLoading } = useQuery({
        queryKey: ["subtitles"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/subtitles`, {
                credentials: "include",
            })
            if (!res.ok) throw new Error("Failed to fetch subtitle styles")
            return res.json() as Promise<SubtitleStyle[]>
        },
    })

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Choose Subtitle Style"
                description="Select the style that best fits your content's aesthetic. These will be animated on your video."
            />

            {/* Live Preview Gallery */}
            <SubtitlePreviewGallery
                segments={request.segments}
                subtitleStyleName={request.subtitleStyleName}
                onPreview={(index) => setPreviewIndex(index)}
            />

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Skip Subtitles Option */}
                    <div
                        onClick={() => updateRequest({ subtitleStyleId: undefined, subtitleStyleName: undefined })}
                        className={cn(
                            "group relative flex flex-col items-center justify-between rounded-[24px] border-2 cursor-pointer transition-all duration-300 overflow-hidden aspect-[4/5] bg-slate-50",
                            !request.subtitleStyleId
                                ? "border-purple-600 shadow-xl shadow-purple-100 scale-[1.02]"
                                : "border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1"
                        )}
                    >
                        <div className="flex-1 w-full flex items-center justify-center bg-slate-200/50 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:16px_16px]" />
                            <Ban className={cn(
                                "h-12 w-12 transition-all duration-500 group-hover:scale-110",
                                !request.subtitleStyleId ? "text-purple-600" : "text-slate-400"
                            )} />
                        </div>

                        <div className="w-full p-4 bg-white border-t border-slate-50 flex flex-col items-center gap-1 z-10">
                            <span className={cn(
                                "font-bold text-sm transition-colors",
                                !request.subtitleStyleId ? "text-purple-600" : "text-slate-700"
                            )}>
                                Skip Subtitles
                            </span>
                            {!request.subtitleStyleId && (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {subtitleStyles?.map((style) => {
                        const isSelected = request.subtitleStyleId === style.id

                        return (
                            <div
                                key={style.id}
                                onClick={() => updateRequest({
                                    subtitleStyleId: style.id,
                                    subtitleStyleName: style.name
                                })}
                                className={cn(
                                    "group relative flex flex-col items-center justify-between rounded-[24px] border-2 cursor-pointer transition-all duration-300 overflow-hidden aspect-[4/5] bg-slate-50",
                                    isSelected
                                        ? "border-purple-600 shadow-xl shadow-purple-100 scale-[1.02]"
                                        : "border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1"
                                )}
                            >
                                {/* Preview Area */}
                                <div className="flex-1 w-full flex items-center justify-center bg-slate-200/50 relative overflow-hidden">
                                    {/* Background Grid Pattern */}
                                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:16px_16px]" />

                                    <div className={cn(STYLE_MAPPING[style.name] || "", "text-center relative z-10 transition-transform duration-500 group-hover:scale-110")}>
                                        {PREVIEW_MAPPING[style.name] || style.preview}
                                    </div>
                                </div>

                                {/* Info Area */}
                                <div className="w-full p-4 bg-white border-t border-slate-50 flex flex-col items-center gap-1 z-10">
                                    <span className={cn(
                                        "font-bold text-sm transition-colors",
                                        isSelected ? "text-purple-600" : "text-slate-700"
                                    )}>
                                        {style.name}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                            <Check className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Live Preview Section */}
            {request.subtitleStyleId && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Live Preview</h3>
                    <div className="bg-slate-900 rounded-2xl p-8 flex items-center justify-center min-h-[200px]">
                        <div className={cn(
                            STYLE_MAPPING[request.subtitleStyleName || ""] || "font-sans font-bold text-white text-3xl",
                            "text-center animate-in fade-in duration-500"
                        )}>
                            {request.subtitleStyleName || "Preview"}
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 text-center mt-4">
                        This is how your subtitles will appear on your video
                    </p>
                </div>
            )}

            <SubtitlePreviewDialog
                open={previewIndex !== null}
                onOpenChange={(open) => !open && setPreviewIndex(null)}
                segments={request.segments}
                subtitleStyleName={request.subtitleStyleName}
                initialIndex={previewIndex || 0}
            />
        </div>
    )
}
