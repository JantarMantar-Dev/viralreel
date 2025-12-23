import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import StepHeader from "../components/step-header"
import { Check, Ban } from "lucide-react"

export interface SubtitleStyle {
    id: string
    name: string
    description: string
    preview: string
    css: string
}

export const SUBTITLE_STYLES: SubtitleStyle[] = [
    {
        id: "classic-capcut",
        name: "Classic CapCut",
        description: "The viral standard",
        preview: "EPIC",
        css: "font-sans font-black text-white stroke-black drop-shadow-[0_2px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-tight leading-none"
    },
    {
        id: "bold-impact",
        name: "Bold Impact",
        description: "High retention",
        preview: "WAR",
        css: "font-sans font-black text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase text-4xl tracking-normal"
    },
    {
        id: "neon-glow",
        name: "Neon Glow",
        description: "Cyberpunk vibe",
        preview: "LIT",
        css: "font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase text-4xl tracking-widest"
    },
    {
        id: "minimal-clean",
        name: "Minimal Clean",
        description: "Modern aesthetic",
        preview: "Clean",
        css: "font-sans font-medium text-slate-900 bg-white/90 px-3 py-1 rounded-lg text-2xl tracking-wide lowercase"
    },
    {
        id: "gradient-pop",
        name: "Gradient Pop",
        description: "Colorful energy",
        preview: "VIBE",
        css: "font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm uppercase text-4xl tracking-tighter"
    },
    {
        id: "comic-book",
        name: "Comic Book",
        description: "Fun & Engaging",
        preview: "POW!",
        css: "font-sans font-extrabold text-white text-4xl tracking-wide uppercase drop-shadow-[3px_3px_0_#000] -rotate-3"
    },
    {
        id: "typewriter",
        name: "Typewriter",
        description: "Storytelling focus",
        preview: "typing...",
        css: "font-mono font-medium text-green-400 bg-black/80 px-4 py-2 rounded-sm text-xl tracking-tight"
    },
    {
        id: "huge-beast",
        name: "MrBeast Style",
        description: "Maximum attention",
        preview: "HUGE",
        css: "font-sans font-black text-white text-5xl tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] stroke-[3px] stroke-black"
    },
    {
        id: "karaoke-highlight",
        name: "Karaoke",
        description: "Sing-along style",
        preview: "Sing",
        css: "font-sans font-bold text-purple-300 text-3xl tracking-normal capitalize drop-shadow-md"
    }
]

export default function SubtitleStep() {
    const { request, updateRequest } = useCreation()

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Choose Subtitle Style"
                description="Select the style that best fits your content's aesthetic."
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Skip Subtitles Option */}
                <div
                    onClick={() => updateRequest({ subtitleTemplateId: undefined, subtitleTemplateName: undefined })}
                    className={cn(
                        "group relative flex flex-col items-center justify-between rounded-[24px] border-2 cursor-pointer transition-all duration-300 overflow-hidden aspect-[4/5] bg-slate-50",
                        !request.subtitleTemplateId
                            ? "border-purple-600 shadow-xl shadow-purple-100 scale-[1.02]"
                            : "border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1"
                    )}
                >
                    <div className="flex-1 w-full flex items-center justify-center bg-slate-200/50 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:16px_16px]" />
                        <Ban className={cn(
                            "h-12 w-12 transition-all duration-500 group-hover:scale-110",
                            !request.subtitleTemplateId ? "text-purple-600" : "text-slate-400"
                        )} />
                    </div>

                    <div className="w-full p-4 bg-white border-t border-slate-50 flex flex-col items-center gap-1 z-10">
                        <span className={cn(
                            "font-bold text-sm transition-colors",
                            !request.subtitleTemplateId ? "text-purple-600" : "text-slate-700"
                        )}>
                            Skip Subtitles
                        </span>
                        {!request.subtitleTemplateId && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {SUBTITLE_STYLES.map((style) => {
                    const isSelected = request.subtitleTemplateId === style.id

                    return (
                        <div
                            key={style.id}
                            onClick={() => updateRequest({
                                subtitleTemplateId: style.id,
                                subtitleTemplateName: style.name
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

                                <div className={cn(style.css, "text-center relative z-10 transition-transform duration-500 group-hover:scale-110")}>
                                    {style.preview}
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
        </div>
    )
}
