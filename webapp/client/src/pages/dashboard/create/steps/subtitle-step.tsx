import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import StepHeader from "../components/step-header"
import { Check, Ban, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { API_BASE_URL } from "@/lib/config"

export interface SubtitleStyle {
    id: string
    name: string
    description: string
    preview: string
    css: string
}

export default function SubtitleStep() {
    const { request, updateRequest } = useCreation()

    const { data: subtitleStyles, isLoading } = useQuery({
        queryKey: ["subtitles"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/subtitles`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch subtitle styles");
            return res.json() as Promise<SubtitleStyle[]>;
        },
    })

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Choose Subtitle Style"
                description="Select the style that best fits your content's aesthetic."
            />

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            ) : (
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

                    {subtitleStyles?.map((style) => {
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
            )}
        </div>
    )
}
