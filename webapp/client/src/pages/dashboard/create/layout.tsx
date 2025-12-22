import { useState } from "react"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import {
    ChevronLeft,
    X,
    Check,
    Wand2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VOICES, Voice } from "./steps/voice-step"
import { TRACKS } from "./steps/music-step"
import { SUBTITLE_STYLES, SubtitleStyle } from "./steps/subtitle-step"
import { Track } from "./components/music-list"
import {
    CreationContext,
    VideoJobRequest,
    INITIAL_REQUEST
} from "./context/creation-context"

const STEPS = [
    { id: 1, title: "Choose Niche", path: "niche" },
    { id: 2, title: "Script & Idea", path: "script" },
    { id: 3, title: "AI Voice", path: "voice" },
    { id: 4, title: "Background Music", path: "music" },
    { id: 5, title: "Subtitles", path: "subtitles" },
    { id: 6, title: "Review", path: "review" }
]


export default function CreateVideoLayout() {
    const [request, setRequest] = useState<VideoJobRequest>(INITIAL_REQUEST)
    const navigate = useNavigate()
    const location = useLocation()

    const updateRequest = (data: Partial<VideoJobRequest>) => {
        setRequest(prev => ({ ...prev, ...data }))
    }

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
        } else if (currentStep === STEPS.length) {
            // Handle generation here
            console.log("Generating series...", request)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            navigate(STEPS[currentStep - 2].path)
        }
    }

    return (
        <CreationContext.Provider value={{
            request,
            updateRequest,
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
                            {STEPS.find((s: { id: number; title: string }) => s.id === currentStep)?.title}
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
                {request.nicheId && (
                    <footer className="sticky bottom-0 z-30 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 md:px-6 py-4 mt-auto">
                        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                {currentStep > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={prevStep}
                                        className="h-12 px-6 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-lg transition-all"
                                    >
                                        Back
                                    </Button>
                                )}

                                {currentStep === 3 && request.voiceId && (
                                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Selected:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{VOICES.find((v: Voice) => v.id === request.voiceId)?.name}</span>
                                    </div>
                                )}

                                {currentStep === 4 && request.musicId && (
                                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mood:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{TRACKS.find((t: Track) => t.id === request.musicId)?.name}</span>
                                    </div>
                                )}

                                {currentStep === 5 && request.subtitleTemplateId && (
                                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Style:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{SUBTITLE_STYLES.find((t: SubtitleStyle) => t.id === request.subtitleTemplateId)?.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {currentStep === 6 && (
                                    <Button
                                        variant="outline"
                                        className="flex-1 md:w-40 h-12 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:text-slate-900 transition-all"
                                    >
                                        Save Draft
                                    </Button>
                                )}
                                <Button
                                    onClick={nextStep}
                                    disabled={
                                        (currentStep === 2 && (!request.scriptIdea.trim() || !request.seriesName.trim() || !request.episode1Title.trim())) ||
                                        (currentStep === 5 && !request.subtitleTemplateId)
                                    }
                                    className={cn(
                                        "w-full h-12 rounded-xl transition-all font-bold text-lg shadow-xl",
                                        currentStep === 6
                                            ? "bg-purple-600 hover:bg-purple-700 text-white md:w-60 shadow-purple-200 hover:scale-[1.02] active:scale-[0.98]"
                                            : "bg-purple-600 hover:bg-purple-700 text-white max-w-xs shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                                    )}
                                >
                                    {currentStep === 6 ? (
                                        <>
                                            <Wand2 className="mr-2 h-5 w-5" />
                                            Generate Series
                                        </>
                                    ) : (
                                        `Continue to Step ${currentStep + 1}`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </CreationContext.Provider>
    )
}
