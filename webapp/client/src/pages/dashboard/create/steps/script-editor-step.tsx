import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreation } from "../context/creation-context"
import { Button } from "@/components/ui/button"
import StepHeader from "../components/step-header"
import { API_BASE_URL } from "@/lib/config"

const MAX_GENERATIONS = 3

export default function ScriptEditorStep() {
    const {
        request,
        updateRequest,
    } = useCreation()

    const [showFullScript, setShowFullScript] = useState(true)
    const [localFeedback, setLocalFeedback] = useState("")

    const remainingGenerations = MAX_GENERATIONS - request.scriptGenerationCount

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
                    ...(feedback && { feedback }),
                    ...(isRegenerate && request.generatedScript && { 
                        previousScript: request.generatedScript.story 
                    }),
                }),
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to generate script")
            }
            return response.json()
        },
        onSuccess: (data) => {
            updateRequest({
                generatedScript: data.script,
                scriptGenerationCount: request.scriptGenerationCount + 1,
                scriptFeedback: undefined
            })
            setLocalFeedback("")
            toast.success(
                request.scriptGenerationCount === 0 
                    ? "Script generated successfully!" 
                    : "Script regenerated successfully!"
            )
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

    const isGenerating = generateScriptMutation.isPending

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
            <StepHeader
                title="Script Editor"
                description="Generate, review, and refine your AI-generated script. You have 3 attempts to get the perfect script."
            />

            {/* Generation Status Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                            <Wand2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Script Generation</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                {request.generatedScript 
                                    ? "Review your generated script below" 
                                    : "Click the button below to generate your script"}
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
                {!request.generatedScript && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-2">Your Script Idea:</h4>
                            <p className="text-slate-600 leading-relaxed line-clamp-4">
                                {request.scriptIdea}
                            </p>
                        </div>

                        <Button
                            onClick={handleGenerateScript}
                            disabled={isGenerating}
                            className="w-full h-14 bg-purple-600 hover:bg-purple-700 gap-3 text-lg font-bold rounded-xl"
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
                {request.generatedScript && (
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
                                        {request.generatedScript.wordCount} words
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
                                            {request.generatedScript.story}
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
