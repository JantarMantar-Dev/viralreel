import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    Sparkles,
    FileText,
    RefreshCw,
    Loader2,
    MessageSquare,
    AlertCircle,
    Wand2,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Timer,
    Layers,
    Check,
    Palette,
    Zap,
    Ghost,
    Cloud,
    Sword,
    Moon,
    Box,
    Camera,
    Stars,
    Aperture,
    Clapperboard,
    Smartphone,
    Monitor,
    Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorCreation } from "../context/editor-creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../../create/components/step-header"
import { API_BASE_URL } from "@/lib/config"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCreateDraftVideo } from "@/hooks/useEditorApi"

const MAX_GENERATIONS = 3

export const IMAGE_STYLES = [
    { id: "comic", name: "Comic", description: "Bold comic-book style, thick outlines", icon: Zap },
    { id: "creepy-comic", name: "Creepy Comic", description: "Horror-comic style, exaggerated shades", icon: Ghost },
    { id: "painting", name: "Painting", description: "Detailed traditional painting style", icon: Palette },
    { id: "ghibli", name: "Ghibli", description: "Studio Ghibli-inspired, soft colors", icon: Cloud },
    { id: "anime", name: "Anime", description: "Clean anime style, sharp linework", icon: Sword },
    { id: "dark-fantasy", name: "Dark Fantasy", description: "Moody atmosphere, dark colors", icon: Moon },
    { id: "lego", name: "Lego", description: "Plastic texture, LEGO figure style", icon: Box },
    { id: "polaroid", name: "Polaroid", description: "Vintage Polaroid style, soft glow", icon: Camera },
    { id: "disney", name: "Disney", description: "Classic animation style, soft curves", icon: Stars },
    { id: "realism", name: "Realism", description: "Ultra-realistic photographic style", icon: Aperture },
    { id: "fantastic", name: "Fantastic", description: "Vibrant magical fantasy style", icon: Sparkles },
    { id: "custom", name: "Add Your Own", description: "Use your own custom image style prompt", icon: Plus, comingSoon: true },
]

export default function EditorScriptStep() {
    const {
        request,
        updateRequest,
    } = useEditorCreation()
    const queryClient = useQueryClient()

    const [showFullScript, setShowFullScript] = useState(true)
    const [localFeedback, setLocalFeedback] = useState("")

    const remainingGenerations = MAX_GENERATIONS - request.scriptGenerationCount

    // Draft creation hook
    const createDraftMutation = useCreateDraftVideo()

    // Script generation mutation
    const generateScriptMutation = useMutation({
        mutationFn: async (feedback?: string) => {
            const isRegenerate = request.scriptGenerationCount > 0
            const endpoint = isRegenerate ? "regenerate" : "generate"
            
            const response = await fetch(`${API_BASE_URL}/api/scripting/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    scriptIdea: request.scriptIdea,
                    nicheName: request.nicheName,
                    duration: request.duration,
                    voiceId: request.voiceId || "Zephyr",
                    // Pass videoId if we have one, so script is saved to DB
                    ...(request.videoId && { videoId: request.videoId }),
                    ...(feedback && { feedback }),
                    ...(isRegenerate && request.approvedScript && { 
                        previousScript: request.approvedScript.story 
                    }),
                }),
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to generate script")
            }
            return response.json()
        },
        onSuccess: async (data) => {
            // Update script in context
            updateRequest({
                approvedScript: data.script,
                scriptGenerationCount: request.scriptGenerationCount + 1,
                scriptFeedback: undefined
            })
            setLocalFeedback("")

            // Create draft video if we don't have one yet (enables auto-save)
            if (!request.videoId) {
                try {
                    const draftResult = await createDraftMutation.mutateAsync({
                        nicheId: request.nicheId,
                        nicheName: request.nicheName,
                        episodeTitle: request.episodeTitle,
                        scriptIdea: request.scriptIdea,
                        duration: request.duration,
                        visualStyle: request.visualStyle,
                        approvedScript: data.script,
                    })
                    updateRequest({ videoId: draftResult.videoId })
                    toast.success("Script generated and saved!")
                } catch (error) {
                    console.error("Failed to create draft:", error)
                    toast.success("Script generated successfully!")
                }
            } else {
                // Invalidate cache so returning to this page shows fresh data
                queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
                
                toast.success(
                    request.scriptGenerationCount === 0 
                        ? "Script generated successfully!" 
                        : "Script regenerated successfully!"
                )
            }
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const handleGenerateScript = () => {
        if (remainingGenerations <= 0) {
            toast.error("You've reached the maximum number of generations. Please continue or go back to modify your idea.")
            return
        }
        generateScriptMutation.mutate(localFeedback || undefined)
    }

    const isGenerating = generateScriptMutation.isPending || createDraftMutation.isPending

    // Check if details are filled enough to generate
    const canGenerate = request.episodeTitle.trim() && request.scriptIdea.trim()

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            <StepHeader
                title="Script & Details"
                description="Define your video details and generate your AI script. You have 3 attempts to get the perfect script."
            />

            {/* Section 0: Video Name */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                        <Clapperboard className="h-4 w-4 text-purple-600" />
                        Video Name
                    </label>
                    <input
                        type="text"
                        value={request.episodeTitle}
                        onChange={(e) => updateRequest({ episodeTitle: e.target.value })}
                        placeholder="e.g. My Amazing Video"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-purple-50 focus:border-purple-500 outline-none transition-all font-medium"
                    />
                </div>
            </div>

            {/* Section 0.5: Aspect Ratio */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-start gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Choose Aspect Ratio</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose between portrait (perfect for Reels/Shorts) or landscape (standard video).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => updateRequest({ aspectRatio: 'portrait' })}
                        className={cn(
                            "relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                            request.aspectRatio === 'portrait'
                                ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                                : "border-slate-100 bg-slate-50/50 hover:border-purple-200 hover:bg-white"
                        )}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "relative w-16 h-28 rounded-xl border-4 transition-all duration-300 flex items-center justify-center overflow-hidden",
                                request.aspectRatio === 'portrait' ? "border-purple-600 bg-purple-100" : "border-slate-300 bg-slate-100 group-hover:border-purple-300"
                            )}>
                                <Smartphone className={cn("h-8 w-8", request.aspectRatio === 'portrait' ? "text-purple-600" : "text-slate-400")} />
                                <div className="absolute bottom-2 w-4 h-1 bg-current rounded-full opacity-30" />
                            </div>
                            <div className="text-center">
                                <span className={cn("font-bold block text-lg", request.aspectRatio === 'portrait' ? "text-purple-900" : "text-slate-700")}>
                                    Portrait (9:16)
                                </span>
                                <span className="text-sm text-slate-500 font-medium">Perfect for Reels, Shorts & TikTok</span>
                            </div>
                        </div>
                        {request.aspectRatio === 'portrait' && (
                            <div className="absolute top-4 right-4 bg-purple-600 text-white p-1 rounded-full shadow-lg">
                                <Check className="h-4 w-4" />
                            </div>
                        )}
                    </div>

                    <div
                        className={cn(
                            "relative p-6 rounded-2xl border-2 transition-all duration-300 group opacity-60 cursor-not-allowed bg-slate-50/50 border-slate-100"
                        )}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "relative w-28 h-18 rounded-xl border-4 transition-all duration-300 flex items-center justify-center overflow-hidden border-slate-300 bg-slate-100"
                            )}>
                                <Monitor className={cn("h-8 w-8 text-slate-400")} />
                                <div className="absolute bottom-2 w-2 h-2 bg-current rounded-full opacity-30" />
                            </div>
                            <div className="text-center">
                                <span className={cn("font-bold block text-lg text-slate-400")}>
                                    Landscape (16:9)
                                </span>
                                <span className="text-sm text-slate-400 font-medium">Best for YouTube & Standard Videos</span>
                            </div>
                        </div>
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Coming Soon
                        </span>
                    </div>
                </div>
            </div>

            {/* Section 1: Video Idea & Context */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Video Idea & Context</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Describe what you want the AI to talk about. Be as detailed as possible about tone, style, and specific topics.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={request.scriptIdea}
                        onChange={(e) => updateRequest({ scriptIdea: e.target.value })}
                        placeholder="Example: Create a video about 'Unsolved Ocean Mysteries'. The tone should be suspenseful and eerie. Start with the Bermuda Triangle, then move to the Mariana Trench anomalies..."
                        className="w-full min-h-[180px] p-4 md:p-6 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none resize-none transition-all text-base leading-relaxed"
                        maxLength={10000}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-400">
                            {request.scriptIdea.length}/10000
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="bg-white hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 gap-2 transition-all shadow-sm opacity-50 cursor-not-allowed"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Enhance with AI
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>This feature is coming soon</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Section 1.5: Image Style */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                        <Palette className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Image Style</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose the artistic direction for your AI-generated visuals.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {IMAGE_STYLES.map((style: any) => {
                        const isSelected = request.visualStyle === style.id
                        const isDisabled = style.comingSoon
                        return (
                            <div
                                key={style.id}
                                onClick={() => !isDisabled && updateRequest({ visualStyle: style.id })}
                                className={cn(
                                    "relative p-4 rounded-[20px] border-2 transition-all duration-300 group overflow-hidden",
                                    isSelected
                                        ? "border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-100"
                                        : (isDisabled ? "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed" : "border-slate-100 bg-slate-50/50 hover:border-purple-200 hover:bg-white"),
                                    !isDisabled && "cursor-pointer"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-purple-600 text-white p-0.5 rounded-full z-10 animate-in zoom-in duration-300 shadow-md">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                                {isDisabled && (
                                    <span className="absolute top-2 right-2 text-[8px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider z-10">
                                        Coming Soon
                                    </span>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 transform",
                                        !isDisabled && "group-hover:scale-110",
                                        isSelected ? "bg-purple-600 text-white" : "bg-white text-slate-400 shadow-sm border border-slate-100",
                                        !isDisabled && !isSelected && "group-hover:text-purple-600"
                                    )}>
                                        <style.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn(
                                            "font-extrabold text-sm truncate",
                                            isSelected ? "text-purple-900" : "text-slate-700",
                                            isDisabled && "text-slate-400"
                                        )}>
                                            {style.name}
                                        </h4>
                                        <p className="text-[10px] font-semibold text-slate-400 leading-tight mt-0.5">
                                            {style.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Section 2: Duration */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                        <Timer className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Duration</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Target video length: <span className="text-purple-600 font-bold">{request.duration === 0.5 ? "30 Seconds" : `${request.duration} Minute${request.duration > 1 ? 's' : ''}`}</span>
                        </p>
                    </div>
                </div>

                <div className="px-2 md:px-4 py-4">
                    <div className="relative h-12 flex items-center select-none">
                        <div className="absolute w-full h-2 bg-slate-100 rounded-full overflow-hidden" />

                        <div className="absolute w-full flex justify-between items-center">
                            {[0.5, 1, 2, 3, 4, 5].map((step) => {
                                const isActive = request.duration === step
                                const isDisabled = step > 1

                                return (
                                    <div
                                        key={step}
                                        className={cn(
                                            "relative group",
                                            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                        )}
                                        onClick={() => !isDisabled && updateRequest({ duration: step })}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 relative",
                                            isActive ? "border-purple-600 bg-purple-600" : (isDisabled ? "border-slate-200 bg-slate-100" : "border-slate-300 bg-white group-hover:border-purple-300"),
                                            isActive && "scale-150 ring-4 ring-purple-100"
                                        )} />

                                        <div className={cn(
                                            "absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors whitespace-nowrap flex flex-col items-center gap-1",
                                            isActive ? "text-purple-600" : (isDisabled ? "text-slate-300" : "text-slate-400")
                                        )}>
                                            <span>{step === 0.5 ? '30s' : `${step}m`}</span>
                                            {isDisabled && (
                                                <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded uppercase tracking-wider hidden group-hover:block absolute top-full mt-1 whitespace-nowrap z-20">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Visual Format */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-pink-50 text-pink-600">
                        <Layers className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Visual Format</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Choose your storytelling medium.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => updateRequest({ visualFormat: 'image' })}
                        className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group",
                            request.visualFormat === 'image'
                                ? "border-purple-600 bg-purple-50/30"
                                : "border-slate-100 bg-slate-50/30 hover:border-slate-300"
                        )}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                            request.visualFormat === 'image' ? "border-purple-600" : "border-slate-300 group-hover:border-slate-400"
                        )}>
                            {request.visualFormat === 'image' && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                        </div>
                        <div>
                            <span className={cn("font-bold block", request.visualFormat === 'image' ? "text-purple-900" : "text-slate-700")}>
                                Dynamic Image Story
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Rotations & Ken Burns effects</span>
                        </div>
                    </div>

                    <div className="relative p-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0" />
                        <div>
                            <span className="font-bold block text-slate-400">
                                Video B-Roll Story
                            </span>
                            <span className="text-xs text-slate-400 font-medium">AI-selected stock footage</span>
                        </div>
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Coming Soon
                        </span>
                    </div>
                </div>
            </div>

            {/* Script Generation Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Script Generation</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                {request.approvedScript 
                                    ? "Review your generated script below" 
                                    : "Fill in the details above and generate your script"}
                            </p>
                        </div>
                    </div>
                    <div className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold",
                        remainingGenerations > 1 
                            ? "bg-green-100 text-green-700"
                            : remainingGenerations === 1 
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                    )}>
                        {remainingGenerations} {remainingGenerations === 1 ? "try" : "tries"} remaining
                    </div>
                </div>

                {/* Script not generated yet */}
                {!request.approvedScript && (
                    <div className="space-y-6">
                        {!canGenerate && (
                            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-amber-900">Complete the details above</h4>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Please fill in the video name and idea before generating a script.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleGenerateScript}
                            disabled={isGenerating || !canGenerate}
                            className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generating Script...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    Generate Script
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Script generated - Show preview */}
                {request.approvedScript && (
                    <div className="space-y-6">
                        {/* Script Preview */}
                        <div className="bg-white rounded-2xl border-2 border-purple-200 overflow-hidden">
                            <button
                                onClick={() => setShowFullScript(!showFullScript)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    <span className="font-bold text-slate-900">Generated Script</span>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                        {request.approvedScript.wordCount} words
                                    </span>
                                </div>
                                {showFullScript ? (
                                    <ChevronUp className="h-5 w-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-slate-400" />
                                )}
                            </button>

                            {showFullScript && (
                                <div className="border-t border-purple-100">
                                    <div className="p-6 max-h-[400px] overflow-y-auto bg-slate-50/50">
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                            {request.approvedScript.story}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Feedback Section - Only show if more generations available */}
                        {remainingGenerations > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <MessageSquare className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900">Want changes?</h4>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Describe what you'd like to change and we'll regenerate the script with your feedback.
                                        </p>
                                    </div>
                                </div>
                                <textarea
                                    value={localFeedback}
                                    onChange={(e) => setLocalFeedback(e.target.value)}
                                    placeholder="e.g., Make it more dramatic, add a twist at the end, use simpler language, focus more on the mystery aspect..."
                                    className="w-full min-h-[100px] p-4 rounded-xl border border-amber-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-amber-50 focus:border-amber-400 outline-none resize-none transition-all text-sm leading-relaxed"
                                    maxLength={500}
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs font-medium text-slate-400">
                                        {localFeedback.length}/500
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* No more generations warning */}
                        {remainingGenerations === 0 && (
                            <div className="bg-red-50 rounded-2xl border border-red-200 p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-900">No more regenerations available</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        You've used all 3 attempts. Click "Continue" below to proceed with this script, or go back to modify your original idea.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Regenerate Button - only if more generations available */}
                        {remainingGenerations > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleGenerateScript}
                                disabled={isGenerating}
                                className="w-full h-12 gap-2 rounded-xl border-2"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                {localFeedback.trim() 
                                    ? "Regenerate with Feedback" 
                                    : "Regenerate Script"}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Tips Section */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Tips for better scripts
                </h4>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li>Be specific about the tone (suspenseful, funny, educational, etc.)</li>
                    <li>Include key points or facts you want mentioned</li>
                    <li>Mention your target audience if relevant</li>
                    <li>Use the feedback box to refine specific parts of the script</li>
                </ul>
            </div>
        </div>
    )
}
