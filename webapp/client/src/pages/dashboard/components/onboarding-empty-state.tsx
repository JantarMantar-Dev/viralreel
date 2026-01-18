import { useState } from "react"
import { SquarePlay, Layers, ArrowRight, Plus, Zap, Edit3, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

type Step = 'mode-select' | 'type-select'

export function OnboardingEmptyState() {
    const [step, setStep] = useState<Step>('mode-select')
    const navigate = useNavigate()

    // Mode Selection Step
    if (step === 'mode-select') {
        return (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
                    Choose your creation mode
                </h2>
                <p className="text-lg text-slate-500 mb-12 max-w-2xl">
                    Select how you want to create your AI video. Auto Mode is fast and simple, while Editor Mode gives you full creative control.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4">
                    {/* Auto Mode Card */}
                    <div 
                        onClick={() => setStep('type-select')}
                        className="group relative flex flex-col items-start p-8 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 cursor-pointer"
                    >
                        <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-600">
                            <Zap className="h-8 w-8" />
                        </div>

                        <h3 className="text-xl font-semibold text-slate-900 mb-3">
                            Auto Mode
                        </h3>
                        <p className="text-slate-500 text-left mb-8 min-h-[80px]">
                            Quick and easy video creation. Just provide your idea and let AI handle everything - script, visuals, audio, and more.
                        </p>

                        <div className="w-full mt-auto">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Fastest option</span>
                                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Series support</span>
                            </div>
                            <Button
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl group-hover:scale-[1.02] transition-transform"
                            >
                                Select Auto Mode <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Editor Mode Card */}
                    <div 
                        onClick={() => navigate('/editor/niche')}
                        className="group relative flex flex-col items-start p-8 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 cursor-pointer"
                    >
                        <div className="absolute top-4 right-4 bg-purple-100 px-3 py-1 rounded-full">
                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">NEW</span>
                        </div>

                        <div className="mb-6 p-4 rounded-xl bg-purple-50 text-purple-600">
                            <Edit3 className="h-8 w-8" />
                        </div>

                        <h3 className="text-xl font-semibold text-slate-900 mb-3">
                            Editor Mode
                        </h3>
                        <p className="text-slate-500 text-left mb-8 min-h-[80px]">
                            Full creative control over every aspect. Review and refine your script, audio, visuals, and subtitles step by step.
                        </p>

                        <div className="w-full mt-auto">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2 py-1 rounded-full">Per-segment editing</span>
                                <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2 py-1 rounded-full">Regenerate options</span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-12 rounded-xl group-hover:scale-[1.02] transition-transform"
                            >
                                Select Editor Mode <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-sm text-slate-500">
                    Not sure which to choose?{" "}
                    <span className="font-medium text-slate-700">
                        Start with Auto Mode for quick results
                    </span>
                </div>
            </div>
        )
    }

    // Type Selection Step (Auto Mode only)
    return (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
            {/* Back Button */}
            <button
                onClick={() => setStep('mode-select')}
                className="absolute top-4 left-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to mode selection
            </button>

            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Zap className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Auto Mode</span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
                What would you like to create?
            </h2>
            <p className="text-lg text-slate-500 mb-12 max-w-2xl">
                Choose your starting point to unleash the power of AI video generation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4">
                {/* Create Single Video Card */}
                <div className="group relative flex flex-col items-start p-8 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300">
                    <div className="mb-6 p-4 rounded-xl bg-purple-50 text-purple-600">
                        <SquarePlay className="h-8 w-8" />
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        Create Single Video
                    </h3>
                    <p className="text-slate-500 text-left mb-8 min-h-[80px]">
                        Generate a focused, standalone video perfect for social media clips, advertisements, or quick updates. Optimize for any platform instantly.
                    </p>

                    <Button
                        asChild
                        className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl group-hover:scale-[1.02] transition-transform"
                    >
                        <Link to="/create?type=video">
                            Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Create Series Card */}
                <div className="group relative flex flex-col items-start p-8 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300">
                    <div className="absolute top-4 right-4 bg-slate-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">POPULAR</span>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-purple-50 text-purple-600">
                        <Layers className="h-8 w-8" />
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        Create Series
                    </h3>
                    <p className="text-slate-500 text-left mb-8 min-h-[80px]">
                        Generate a cohesive batch of videos for an entire marketing campaign, educational course, or storytelling series. Maintain consistency across multiple clips.
                    </p>

                    <Button
                        asChild
                        variant="outline"
                        className="w-full mt-auto border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-12 rounded-xl group-hover:scale-[1.02] transition-transform"
                    >
                        <Link to="/create?type=series">
                            Create Series <Plus className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mt-16 text-sm text-slate-500">
                Not ready to create?{" "}
                <a href="#" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
                    Explore templates
                </a>
            </div>
        </div>
    )
}
