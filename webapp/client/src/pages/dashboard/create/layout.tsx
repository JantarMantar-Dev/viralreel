import { useState, createContext, useContext, ReactNode } from "react"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import {
    ChevronLeft,
    X,
    Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STEPS = [
    { id: 1, title: "Choose Niche", path: "niche" },
    { id: 2, title: "Script & Idea", path: "script" },
    { id: 3, title: "AI Voice", path: "voice" },
    { id: 4, title: "Visual Style", path: "visuals" },
    { id: 5, title: "Subtitles", path: "subtitles" },
    { id: 6, title: "Music", path: "music" },
    { id: 7, title: "Review", path: "review" }
]

interface CreationContextType {
    selectedNiche: string | null
    setSelectedNiche: (niche: string) => void
    nicheTags: string
    setNicheTags: (tags: string) => void
    nextStep: () => void
    prevStep: () => void
    currentStep: number
}

const CreationContext = createContext<CreationContextType | null>(null)

export function useCreation() {
    const context = useContext(CreationContext)
    if (!context) throw new Error("useCreation must be used within a CreationProvider")
    return context
}

export default function CreateVideoLayout() {
    const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
    const [nicheTags, setNicheTags] = useState("")
    const navigate = useNavigate()
    const location = useLocation()

    // Determine current step based on route path
    const path = location.pathname.split("/").pop()
    const currentStepIndex = STEPS.findIndex(s => s.path === path)
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1

    const handleExit = () => {
        navigate("/dashboard")
    }

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            navigate(STEPS[currentStep].path)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            navigate(STEPS[currentStep - 2].path)
        }
    }

    return (
        <CreationContext.Provider value={{
            selectedNiche,
            setSelectedNiche,
            nicheTags,
            setNicheTags,
            nextStep,
            prevStep,
            currentStep
        }}>
            <div className="flex flex-col min-h-full bg-slate-50/50">
                {/* Workflow Header */}
                <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex text-sm text-slate-500 items-center gap-2">
                            <span>Projects</span>
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                            <span className="text-slate-900 font-medium whitespace-nowrap">Create Series</span>
                        </div>
                        {/* Mobile back button */}
                        <div className="flex sm:hidden">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-500">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Stepper Indicator */}
                    <div className="flex items-center gap-1 md:gap-2">
                        {/* Desktop: Full Stepper */}
                        <div className="hidden lg:flex items-center gap-2">
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
                                                "w-4 xl:w-8 h-[2px] mx-1",
                                                currentStep > step.id ? "bg-purple-200" : "bg-slate-100"
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mobile/Tablet: Compact Stepper Indicator */}
                        <div className="lg:hidden flex flex-col items-center">
                            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                Step {currentStep} of {STEPS.length}
                            </div>
                            <div className="h-1.5 w-24 md:w-32 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-600 transition-all duration-500"
                                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="hidden md:block ml-4 text-sm font-semibold text-slate-900 min-w-[100px]">
                            {STEPS.find(s => s.id === currentStep)?.title}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-3">
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
                <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
                    <Outlet />
                </main>

                {/* Sticky Footer Navigation */}
                {selectedNiche && (
                    <footer className="sticky bottom-0 z-30 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 md:px-6 py-4 flex justify-center mt-auto">
                        <Button
                            onClick={nextStep}
                            className="max-w-xs w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {currentStep === 7 ? "Generate Video" : `Continue to Step ${currentStep + 1}`}
                        </Button>
                    </footer>
                )}
            </div>
        </CreationContext.Provider>
    )
}
