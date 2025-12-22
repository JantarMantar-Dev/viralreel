import {
    Fingerprint,
    Skull,
    History,
    Beaker,
    Zap,
    TrendingUp,
    Plus,
    Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../layout"

const NICHES = [
    {
        id: "true-crime",
        title: "True Crime",
        description: "Deep dives into mysterious cases, cold investigations, and detective...",
        icon: Fingerprint,
        tags: ["#mystery", "#documentary"]
    },
    {
        id: "scary-stories",
        title: "Scary Stories",
        description: "Horror tales, creepypastas, and supernatural events narration.",
        icon: Skull,
        tags: ["#horror", "#fiction"]
    },
    {
        id: "history-facts",
        title: "History & Facts",
        description: "Educational content about historical events, ancient civilizations, and fu...",
        icon: History,
        tags: ["#education", "#learning"]
    },
    {
        id: "science-tech",
        title: "Science & Tech",
        description: "Latest innovations, space discoveries, and futuristic concepts.",
        icon: Beaker,
        tags: ["#future", "#technology"]
    },
    {
        id: "motivation",
        title: "Motivation",
        description: "Inspirational speeches, life advice, and personal growth content.",
        icon: Zap,
        tags: ["#lifestyle", "#growth"]
    },
    {
        id: "business-finance",
        title: "Business & Finance",
        description: "Market analysis, entrepreneurship tips, and money management.",
        icon: TrendingUp,
        tags: ["#money", "#startup"]
    }
]

export default function NicheStep() {
    const { selectedNiche, setSelectedNiche } = useCreation()

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                    What's your series about?
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                    Select a popular niche to get started with optimized templates, or describe your own unique idea.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {NICHES.map((niche) => {
                    const Icon = niche.icon
                    const isSelected = selectedNiche === niche.id
                    return (
                        <div
                            key={niche.id}
                            onClick={() => setSelectedNiche(niche.id)}
                            className={cn(
                                "group relative p-8 rounded-3xl border-2 bg-white transition-all duration-300 cursor-pointer",
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

                            <div className={cn(
                                "mb-6 p-4 rounded-2xl w-fit transition-colors duration-300",
                                isSelected ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                            )}>
                                <Icon className="h-8 w-8" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">
                                {niche.title}
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                                {niche.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {niche.tags.map(tag => (
                                    <span key={tag} className="text-xs font-semibold px-2 py-1 bg-slate-50 text-slate-500 rounded-md">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {/* Create Custom Niche Card */}
                <div
                    className="group relative p-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:border-solid transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center outline-none focus:ring-2 focus:ring-purple-500"
                    onClick={() => setSelectedNiche("custom")}
                >
                    <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 group-hover:text-purple-600 group-hover:border-purple-100 transition-all duration-300">
                        <Plus className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Create Your Own Category</h3>
                    <p className="text-slate-500 text-sm font-medium">
                        Define a custom niche from scratch if yours isn't listed here
                    </p>
                </div>
            </div>
        </div>
    )
}
