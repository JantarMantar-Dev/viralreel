import { useState, useEffect } from "react"
import { useNavigate, useLocation, Outlet, useSearchParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    ChevronLeft,
    X,
    Check,
    Wand2,
    Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/config"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    const [searchParams] = useSearchParams()
    // Initialize jobType from URL or default to "series"
    const [request, setRequest] = useState<VideoJobRequest>(() => ({
        ...INITIAL_REQUEST,
        jobType: (searchParams.get("type") as "video" | "series") || "series",
        seriesId: searchParams.get("seriesId") || undefined,
        nicheId: searchParams.get("nicheId") || null,
    }))
    const [customNext, setCustomNext] = useState<(() => void) | undefined>()
    const [customPrev, setCustomPrev] = useState<(() => void) | undefined>()
    const [canContinue, setCanContinue] = useState(true)
    const [isStepLoading, setIsStepLoading] = useState(false)
    const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()

    const updateRequest = (data: Partial<VideoJobRequest>) => {
        setRequest(prev => ({ ...prev, ...data }))
    }

    // --- Add Episode & Edit Logic ---
    const seriesId = searchParams.get("seriesId")
    const editVideoId = searchParams.get("editVideoId")

    const { data: seriesData } = useQuery({
        queryKey: ["series", seriesId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/projects/series/${seriesId}`, {
                credentials: "include"
            })
            if (!res.ok) throw new Error("Failed to fetch series")
            return res.json()
        },
        enabled: !!seriesId
    })

    const { data: editVideoResponse } = useQuery({
        queryKey: ["editVideo", editVideoId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/jobs/${editVideoId}`, {
                credentials: "include"
            })
            if (!res.ok) throw new Error("Failed to fetch video details")
            return res.json()
        },
        enabled: !!editVideoId
    })

    useEffect(() => {
        if (seriesId && seriesData?.series) {
            const series = seriesData.series;
            updateRequest({
                jobType: "series",
                seriesId: series.id,
                seriesName: series.name,
                nicheId: series.nicheId,
                nicheName: series.nicheName,
            })

            // If we are on the first step (niche), skip to script step
            if (location.pathname.endsWith("/niche") || location.pathname.endsWith("/create")) {
                navigate("script");
            }
        }
    }, [seriesId, seriesData, navigate, location.pathname])

    useEffect(() => {
        if (editVideoId && editVideoResponse?.video) {
            const v = editVideoResponse.video;
            const meta = v.metadata || {};
            updateRequest({
                jobType: v.seriesId ? "series" : "video",
                seriesId: v.seriesId,
                seriesName: v.seriesName || "",
                nicheId: v.nicheId,
                scriptIdea: meta.scriptIdea || "",
                episodeTitle: v.title,
                duration: meta.duration || 1,
                segments: meta.segments || 3,
                visualFormat: meta.visualFormat || "image",
                visualStyle: meta.visualStyle || undefined,
                voiceId: meta.voiceId || undefined,
                subtitleTemplateId: meta.subtitleTemplateId || undefined,
                musicId: meta.musicId || undefined,
            })

            // If we are on the first step (niche), skip to script step
            if (location.pathname.endsWith("/niche") || location.pathname.endsWith("/create")) {
                navigate("script");
            }
        }
    }, [editVideoId, editVideoResponse, navigate, location.pathname])

    // Determine current step based on route path
    const path = location.pathname.split("/").filter(Boolean).pop()
    const currentStepIndex = STEPS.findIndex(s => s.path === path)
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1

    const handleExit = () => {
        navigate("/videos")
    }

    const { mutate: createJob, isPending } = useMutation({
        mutationFn: async (data: VideoJobRequest) => {
            let url = data.seriesId
                ? `${API_BASE_URL}/api/jobs/series/${data.seriesId}/episode`
                : `${API_BASE_URL}/api/jobs`;
            let method = "POST";

            if (editVideoId) {
                url = `${API_BASE_URL}/api/jobs/${editVideoId}`;
                method = "PATCH";
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorData = await response.json()
                // Pass the whole error object if it has a key, otherwise throw generic error
                if (errorData.key) {
                    throw errorData
                }
                throw new Error(errorData.error || errorData.message || "Failed to process job")
            }

            return response.json()
        },
        onSuccess: () => {
            toast.success(editVideoId ? "Job updated successfully!" : "Job created successfully!")
            navigate("/videos")
        },
        onError: (error: any) => {
            // Check if it's our trusted error format
            if (error?.key === "InsuffCredits") {
                setShowInsufficientCreditsDialog(true)
            } else {
                // Fallback for generic errors
                toast.error(error.message || "Something went wrong. Please try again.")
            }
        }
    })

    const nextStep = (bypassOverride = false) => {
        if (customNext && !bypassOverride) {
            customNext()
            return
        }

        if (currentStep < STEPS.length) {
            const nextPath = `/create/${STEPS[currentStep].path}`
            navigate(nextPath)
        } else if (currentStep === STEPS.length) {
            createJob(request)
        }
    }

    const prevStep = () => {
        if (customPrev) {
            customPrev()
            return
        }

        if (currentStep > 1) {
            const prevPath = `/create/${STEPS[currentStep - 2].path}`
            navigate(prevPath)
        }
    }

    const handleSaveDraft = () => {
        createJob({ ...request, isDraft: true })
    }

    return (
        <CreationContext.Provider value={{
            request,
            updateRequest,
            nextStep,
            prevStep,
            currentStep,
            customNext,
            setCustomNext,
            customPrev,
            setCustomPrev,
            canContinue,
            setCanContinue,
            isStepLoading,
            setIsStepLoading
        }}>
            <div className="flex flex-col min-h-full bg-slate-50/50">
                {/* Workflow Header */}
                <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex text-sm text-slate-500 items-center gap-2">
                            <span>My Videos</span>
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                            <span>
                                {request.seriesId ? "Add Episode" : (request.jobType === "series" ? "Create Series" : "Create Video")}
                            </span>
                        </div>
                        {/* Mobile back button */}
                        <div className="flex sm:hidden">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/videos")} className="text-slate-500">
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
                {(request.nicheId || editVideoId || customNext) && (
                    <footer className="sticky bottom-0 z-30 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 md:px-6 py-4 mt-auto">
                        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                {(currentStep > 1 || !!customPrev) && (
                                    <Button
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={isPending}
                                        className="h-12 px-6 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-lg transition-all"
                                    >
                                        Back
                                    </Button>
                                )}

                                {currentStep === 3 && request.voiceName && (
                                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Selected:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{request.voiceName}</span>
                                    </div>
                                )}

                                {currentStep === 4 && request.musicName && (
                                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Music:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{request.musicName}</span>
                                    </div>
                                )}

                                {currentStep === 5 && request.subtitleTemplateName && (
                                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Style:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{request.subtitleTemplateName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {currentStep === 6 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={isPending}
                                        className="flex-1 md:w-40 h-12 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:text-slate-900 transition-all"
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => nextStep()}
                                    disabled={
                                        (currentStep === 1 && !canContinue) ||
                                        (currentStep === 2 && (!request.scriptIdea.trim() || (request.jobType === 'series' && !request.seriesName.trim()) || !request.episodeTitle.trim())) ||
                                        isPending ||
                                        !!isStepLoading
                                    }
                                    className={cn(
                                        "w-full h-12 rounded-xl transition-all font-bold text-lg shadow-xl",
                                        currentStep === 6
                                            ? "bg-purple-600 hover:bg-purple-700 text-white md:w-60 shadow-purple-200 hover:scale-[1.02] active:scale-[0.98]"
                                            : "bg-purple-600 hover:bg-purple-700 text-white max-w-xs shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                                    )}
                                >
                                    {isPending || isStepLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : currentStep === 6 ? (
                                        <>
                                            <Wand2 className="mr-2 h-5 w-5" />
                                            {editVideoId ? "Update Episode" : (request.seriesId ? "Generate Episode" : (request.jobType === "series" ? "Generate Series" : "Generate Video"))}
                                        </>
                                    ) : (
                                        currentStep === 1 && customNext ? "Create & Continue" : `Continue to Step ${currentStep + 1}`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </footer>
                )}

                <Dialog open={showInsufficientCreditsDialog} onOpenChange={setShowInsufficientCreditsDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Insufficient Credits</DialogTitle>
                            <DialogDescription>
                                You don't have enough credits to generate this video. Please upgrade your plan or purchase add-on credits.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowInsufficientCreditsDialog(false)}>Cancel</Button>
                            <Button onClick={() => {
                                setShowInsufficientCreditsDialog(false)
                                navigate("/settings/billing")
                            }}>Buy Credits</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CreationContext.Provider>
    )
}
