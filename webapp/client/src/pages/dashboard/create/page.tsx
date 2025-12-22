import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    ChevronLeft,
    X,
    Fingerprint,
    Skull,
    History,
    Beaker,
    Zap,
    TrendingUp,
    Plus,
    Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"

const STEPS = [
    { id: 1, title: "Choose Niche" },
    { id: 2, title: "Script & Idea" }, // Estimated
    { id: 3, title: "AI Voice" },     // Estimated
    { id: 4, title: "Visual Style" }, // Estimated
    { id: 5, title: "Subtitles" },    // Estimated
    { id: 6, title: "Music" },        // Estimated
    { id: 7, title: "Review" }        // Estimated
]

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

export default function CreateVideoPage() {
    const { session, isPending } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!isPending && !session) {
            navigate("/auth/login")
        }
    }, [session, isPending, navigate])

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Loading...</div>
            </div>
        )
    }

    if (!session) return null

    const handleExit = () => {
        navigate("/dashboard")
    }

    const nextStep = () => {
        if (currentStep < 7) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* Workflow Header */}
            <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span>Projects</span>
                        <ChevronLeft className="h-4 w-4 rotate-180" />
                        <span className="text-slate-900 font-medium">Create Series</span>
                    </div>
                </div>

                {/* Stepper Indicator */}
                <div className="flex items-center gap-2">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300",
                                    currentStep === step.id
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110"
                                        : currentStep > step.id
                                            ? "bg-purple-100 text-purple-600"
                                            : "bg-slate-100 text-slate-400"
                                )}
                            >
                                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        "w-8 h-[2px] mx-1",
                                        currentStep > step.id ? "bg-purple-200" : "bg-slate-100"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                    <div className="ml-4 text-sm font-semibold text-slate-900">
                        {STEPS.find(s => s.id === currentStep)?.title}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-slate-500 font-medium">
                        Save Draft
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExit}
                        className="rounded-full hover:bg-slate-100 text-slate-400"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
                {currentStep === 1 && (
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
                )}

                {currentStep > 1 && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                        <div className="p-6 rounded-full bg-purple-100 text-purple-600 mb-6">
                            <Zap className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Step {currentStep}: {STEPS.find(s => s.id === currentStep)?.title}
                        </h2>
                        <p className="text-lg text-slate-500 mb-8 max-w-md text-center">
                            This step is coming soon. The current niche selected is: <span className="text-purple-600 font-bold capitalize">{selectedNiche?.replace('-', ' ')}</span>
                        </p>
                        <Button onClick={prevStep} variant="outline" className="px-8">
                            Back
                        </Button>
                    </div>
                )}
            </main>

            {/* Sticky Footer Navigation */}
            {currentStep === 1 && selectedNiche && (
                <footer className="sticky bottom-0 z-30 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex justify-center animate-in slide-in-from-bottom-full mt-auto">
                    <Button
                        onClick={nextStep}
                        className="max-w-xs w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Continue to Step 2
                    </Button>
                </footer>
            )}
        </div>
    )
}
