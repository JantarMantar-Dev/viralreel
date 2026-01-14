import { useState, useEffect, useMemo } from "react"
import { useNavigate, useLocation, Outlet, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    ChevronLeft,
    X,
    Check,
    Loader2,
    Cloud,
    CloudOff
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    EditorCreationContext,
    EditorModeRequest,
    INITIAL_EDITOR_REQUEST,
    isReadyForEditorSubmission,
    toEditorJobRequest,
} from "./context/editor-creation-context"
import { SharedContext, createSharedFromEditorContext } from "../shared/context/shared-creation-interface"
import { useEditorVideo } from "@/hooks/useEditorApi"
import { useAutoSave } from "@/hooks/useAutoSave"

// Editor Mode steps (6 steps with full control)
const STEPS = [
    { id: 1, title: "Choose Niche", path: "niche" },
    { id: 2, title: "Script & Details", path: "script" },
    { id: 3, title: "Audio Synthesis", path: "audio" },
    { id: 4, title: "Visuals", path: "visuals" },
    { id: 5, title: "Subtitles", path: "subtitles" },
    { id: 6, title: "Review & Render", path: "review" }
]

export default function EditorModeLayout() {
    const [searchParams] = useSearchParams()
    const videoIdParam = searchParams.get("videoId")
    const [request, setRequest] = useState<EditorModeRequest>(() => ({
        ...INITIAL_EDITOR_REQUEST,
        nicheId: searchParams.get("nicheId") || null,
        videoId: videoIdParam || undefined,
    }))
    const [customNext, setCustomNext] = useState<(() => void) | undefined>()
    const [customPrev, setCustomPrev] = useState<(() => void) | undefined>()
    const [canContinue, setCanContinue] = useState(true)
    const [isStepLoading, setIsStepLoading] = useState(false)
    const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false)
    const [isVideoLoaded, setIsVideoLoaded] = useState(!videoIdParam) // Start loaded if no videoId

    const navigate = useNavigate()
    const location = useLocation()

    // Load existing video if videoId is provided
    const { data: videoData, isLoading: isLoadingVideo, error: videoError } = useEditorVideo(videoIdParam || undefined)

    // Populate request from loaded video
    useEffect(() => {
        if (videoData?.video && !isVideoLoaded) {
            const video = videoData.video
            const metadata = video.metadata || {}
            
            setRequest(prev => ({
                ...prev,
                videoId: video.id,
                nicheId: video.niche?.id || null,
                nicheName: video.niche?.name,
                episodeTitle: metadata.episodeTitle || video.title || "",
                scriptIdea: metadata.scriptIdea || "",
                duration: metadata.duration || 60,
                visualStyle: metadata.visualStyle,
                voiceId: metadata.voiceId,
                voiceName: metadata.voiceName,
                tonePrompt: metadata.tonePrompt,
                subtitleStyleId: metadata.subtitleStyleId,
                subtitleStyleName: metadata.subtitleStyleName,
                approvedScript: metadata.approvedScript,
                audioUrl: video.audioUrl || undefined,
                audioDurationSeconds: video.audioDurationSeconds || undefined,
                subtitles: metadata.subtitles || [],
                segments: video.segments || metadata.segments || [],
            }))
            setIsVideoLoaded(true)
        }
    }, [videoData, isVideoLoaded])

    // Handle video load error
    useEffect(() => {
        if (videoError) {
            toast.error("Failed to load video. Starting fresh.")
            setIsVideoLoaded(true)
        }
    }, [videoError])

    const updateRequest = (data: Partial<EditorModeRequest>) => {
        setRequest(prev => ({ ...prev, ...data }))
    }

    // Determine current step based on route path
    const path = location.pathname.split("/").filter(Boolean).pop()
    const currentStepIndex = STEPS.findIndex(s => s.path === path)
    const currentStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1

    // Map path to phase for auto-save
    const currentPhase = useMemo(() => {
        const phaseMap: Record<string, "script" | "audio" | "visuals" | "subtitles" | "review"> = {
            script: "script",
            audio: "audio",
            visuals: "visuals",
            subtitles: "subtitles",
            review: "review",
        }
        return path ? phaseMap[path] : undefined
    }, [path])

    // Auto-save integration
    const autoSaveData = useMemo(() => ({
        currentPhase,
        episodeTitle: request.episodeTitle,
        scriptIdea: request.scriptIdea,
        duration: request.duration,
        visualStyle: request.visualStyle,
        voiceId: request.voiceId,
        voiceName: request.voiceName,
        tonePrompt: request.tonePrompt,
        subtitleStyleId: request.subtitleStyleId,
        subtitleStyleName: request.subtitleStyleName,
    }), [
        currentPhase,
        request.episodeTitle,
        request.scriptIdea,
        request.duration,
        request.visualStyle,
        request.voiceId,
        request.voiceName,
        request.tonePrompt,
        request.subtitleStyleId,
        request.subtitleStyleName,
    ])

    const { isDirty, isSaving } = useAutoSave({
        videoId: request.videoId,
        data: autoSaveData,
        enabled: isVideoLoaded && !!request.videoId,
        onSaveError: (error) => {
            console.error("Auto-save failed:", error)
        },
    })

    const handleExit = () => {
        navigate("/videos")
    }

    const { mutate: createJob, isPending } = useMutation({
        mutationFn: async (data: EditorModeRequest) => {
            if (!isReadyForEditorSubmission(data)) {
                throw new Error("Script must be approved before submission")
            }

            const requestBody = toEditorJobRequest(data)
            const url = `${API_BASE_URL}/api/editor-jobs`

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorData = await response.json()
                if (errorData.key) {
                    throw errorData
                }
                throw new Error(errorData.error || errorData.message || "Failed to process job")
            }

            return response.json()
        },
        onSuccess: () => {
            toast.success("Video rendering started!")
            navigate("/videos")
        },
        onError: (error: any) => {
            if (error?.key === "InsuffCredits") {
                setShowInsufficientCreditsDialog(true)
            } else {
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
            const nextPath = `/editor/${STEPS[currentStep].path}`
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
            const prevPath = `/editor/${STEPS[currentStep - 2].path}`
            navigate(prevPath)
        }
    }

    const handleSaveDraft = () => {
        createJob({ ...request, isDraft: true })
    }

    // Get missing fields message for tooltip
    const getMissingFieldsMessage = (): string | null => {
        if (path === 'niche' && !request.nicheId) {
            return "Please select a niche to continue"
        }
        if (path === 'script' && !request.approvedScript) {
            return "Please generate and approve a script"
        }
        return null
    }

    const missingFieldsMessage = getMissingFieldsMessage()

    // Footer visibility logic
    // Hide footer on review step since it has its own render button
    const isReviewStep = path === 'review'
    const hasCompletedNicheStep = !!request.nicheId
    const hasCustomNavigation = !!customNext
    const shouldShowFooter = (hasCompletedNicheStep || hasCustomNavigation) && !isReviewStep

    // Create context values
    const editorContextValue = {
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
    }

    const sharedContextValue = createSharedFromEditorContext(editorContextValue)

    return (
        <EditorCreationContext.Provider value={editorContextValue}>
            <SharedContext.Provider value={sharedContextValue}>
            <div className="flex flex-col min-h-full bg-slate-50/50">
                {/* Workflow Header */}
                <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex text-sm text-slate-500 items-center gap-2">
                            <span>My Videos</span>
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                            <span className="text-purple-600 font-semibold">Editor Mode</span>
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
                        {/* Auto-save indicator */}
                        {request.videoId && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span className="hidden sm:inline">Saving...</span>
                                            </>
                                        ) : isDirty ? (
                                            <>
                                                <CloudOff className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Unsaved</span>
                                            </>
                                        ) : (
                                            <>
                                                <Cloud className="h-3.5 w-3.5 text-green-500" />
                                                <span className="hidden sm:inline text-green-600">Saved</span>
                                            </>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isSaving ? "Saving changes..." : isDirty ? "Changes not yet saved" : "All changes saved"}
                                </TooltipContent>
                            </Tooltip>
                        )}
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
                    {isLoadingVideo ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                            <p className="text-slate-500">Loading your video...</p>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>

                {/* Sticky Footer Navigation */}
                {shouldShowFooter && (
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

                                {path === 'audio' && request.voiceName && (
                                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voice:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{request.voiceName}</span>
                                    </div>
                                )}

                                {path === 'subtitles' && request.subtitleStyleName && (
                                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Style:</span>
                                        <span className="text-lg font-extrabold text-purple-600 font-display">{request.subtitleStyleName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="w-full md:w-auto">
                                            <Button
                                                onClick={() => nextStep()}
                                                disabled={
                                                    (path === 'niche' && !canContinue) ||
                                                    (path === 'script' && !request.approvedScript) ||
                                                    isPending ||
                                                    !!isStepLoading
                                                }
                                                className="w-full h-12 rounded-xl transition-all font-bold text-lg shadow-xl bg-purple-600 hover:bg-purple-700 text-white max-w-xs shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                                            >
                                                {isPending || isStepLoading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    path === 'niche' && customNext ? "Create & Continue" : `Continue to Step ${currentStep + 1}`
                                                )}
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    {missingFieldsMessage && (
                                        <TooltipContent>
                                            <p>{missingFieldsMessage}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </div>
                        </div>
                    </footer>
                )}

                <Dialog open={showInsufficientCreditsDialog} onOpenChange={setShowInsufficientCreditsDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Insufficient Credits</DialogTitle>
                            <DialogDescription>
                                You don't have enough credits to render this video. Please upgrade your plan or purchase add-on credits.
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
            </SharedContext.Provider>
        </EditorCreationContext.Provider>
    )
}
