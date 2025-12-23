import {
    Fingerprint,
    Skull,
    History,
    Beaker,
    Zap,
    TrendingUp,
    Plus,
    Check,
    Lightbulb,
    Search,
    Loader2,
    AlertCircle,
    History as HistoryIcon,
    HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { useQuery } from "@tanstack/react-query"

const ICON_MAP: Record<string, any> = {
    Fingerprint,
    Skull,
    History: HistoryIcon,
    Beaker,
    Zap,
    TrendingUp,
    Lightbulb,
    Search,
    HelpCircle
}

export interface Niche {
    id: string
    name: string
    description: string
    iconName: string
    tags: string | string[]
}

import StepHeader from "../components/step-header"

export default function NicheStep() {
    const { request, updateRequest } = useCreation()

    const { data: niches, isLoading, error } = useQuery<Niche[]>({
        queryKey: ["niches"],
        queryFn: async () => {
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000"
            const res = await fetch(`${apiBase}/api/niches`, {
                credentials: "include"
            })
            if (!res.ok) throw new Error("Failed to fetch niches")
            return res.json()
        }
    })

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StepHeader
                title={request.jobType === "series" ? "What's your series about?" : "What's your video about?"}
                description="Select a popular niche to get started with optimized templates, or describe your own unique idea."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {isLoading ? (
                    // Loading Skeletons
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[280px] rounded-3xl bg-slate-50 animate-pulse border-2 border-slate-100" />
                    ))
                ) : error ? (
                    <div className="col-span-full py-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 mb-4">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h3>
                        <p className="text-slate-500 mb-6">We couldn't load the categories. Please try again.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    niches?.map((niche) => {
                        const Icon = ICON_MAP[niche.iconName] || Fingerprint
                        const isSelected = request.nicheId === niche.id
                        const tagsList = typeof niche.tags === 'string'
                            ? niche.tags.split(',').map(t => t.trim())
                            : (Array.isArray(niche.tags) ? niche.tags : [])

                        return (
                            <div
                                key={niche.id}
                                onClick={() => updateRequest({
                                    nicheId: niche.id,
                                    nicheName: niche.name
                                })}
                                className={cn(
                                    "group relative p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 bg-white transition-all duration-300 cursor-pointer shadow-sm h-full flex flex-col",
                                    isSelected
                                        ? "border-purple-600 shadow-xl shadow-purple-100/50 ring-4 ring-purple-50"
                                        : "border-slate-100 hover:border-purple-200 hover:shadow-lg"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute top-4 right-4 bg-purple-600 text-white p-1 rounded-full scale-110 animate-in zoom-in duration-300">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-4 md:mb-6">
                                    <div className={cn(
                                        "p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors duration-300 shrink-0",
                                        isSelected ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                                    )}>
                                        <Icon className="h-6 w-6 md:h-8 md:w-8" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight">
                                        {niche.name}
                                    </h3>
                                </div>

                                <p className="text-slate-500 text-sm leading-relaxed mb-4 md:mb-6 font-medium line-clamp-3 flex-grow">
                                    {niche.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {tagsList.map(tag => (
                                        <span key={tag} className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-400 rounded-md uppercase tracking-wider">
                                            {tag.startsWith('#') ? tag : `#${tag}`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}

                {/* Create Custom Niche Card - Hidden while loading/error */}
                {!isLoading && !error && (
                    <div
                        className="group relative p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:border-solid transition-all duration-300 cursor-pointer flex flex-col focus:ring-2 focus:ring-purple-500 min-h-[200px]"
                        onClick={() => updateRequest({
                            nicheId: "custom",
                            nicheName: "Custom Niche"
                        })}
                    >
                        <div className="flex items-center gap-4 mb-4 md:mb-6">
                            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 text-slate-400 group-hover:text-purple-600 group-hover:border-purple-100 transition-all duration-300 shrink-0">
                                <Plus className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">Create Your Own Category</h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Define a custom niche from scratch if yours isn't listed here
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
