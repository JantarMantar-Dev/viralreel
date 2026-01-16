import { useState } from "react"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { useEditorCreation, VisualSegment } from "../context/editor-creation-context"
import StepHeader from "../../create/components/step-header"
import { useAnalyzeVisuals, useGenerateSegmentImage, useGenerateAllImages, useUpdateSegmentPrompt } from "@/hooks/useEditorApi"
import { useQueryClient } from "@tanstack/react-query"
import { ImageGallerySection } from "./visuals/image-gallery"
import { SegmentCard } from "./visuals/segment-card"
import { RegeneratePromptsDialog, RegenerateImagesDialog, ImagePreviewDialog } from "./visuals/dialogs"

export default function EditorVisualsStep() {
    const { request, updateRequest } = useEditorCreation()
    const [expandedSegment, setExpandedSegment] = useState<string | null>(null)
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
    const [showRegenerateImagesDialog, setShowRegenerateImagesDialog] = useState(false)
    const [previewImage, setPreviewImage] = useState<{ url?: string, prompt: string } | null>(null)
    const queryClient = useQueryClient()

    // API hooks
    const analyzeVisualsMutation = useAnalyzeVisuals()
    const generateSegmentMutation = useGenerateSegmentImage()
    const generateAllMutation = useGenerateAllImages()
    const updatePromptMutation = useUpdateSegmentPrompt()

    // Check if we have required data
    const hasVideoId = !!request.videoId
    const hasAudio = !!request.audioUrl && !!request.audioDurationSeconds
    const canAnalyze = hasVideoId && hasAudio && !!request.approvedScript

    // Generate all images mutation handler
    const handleGenerateAll = async (skipConfirmation = false) => {
        if (!request.videoId) {
            toast.error("No video ID found. Please go back to the Audio step.")
            return
        }

        if (!request.approvedScript || !request.audioDurationSeconds) {
            toast.error("Missing required data. Please complete the Audio step first.")
            return
        }

        // Check if we have existing images
        const hasExistingImages = request.segments.some(s => s.imageUrl || s.generatedImageUrl)
        if (hasExistingImages && !skipConfirmation) {
            setShowRegenerateImagesDialog(true)
            return
        }

        setShowRegenerateImagesDialog(false)

        try {
            // If we don't have segments yet, analyze first
            if (request.segments.length === 0) {
                const analyzeResult = await analyzeVisualsMutation.mutateAsync({
                    videoId: request.videoId,
                    script: request.approvedScript.story,
                    audioDurationSeconds: request.audioDurationSeconds,
                })

                updateRequest({ segments: analyzeResult.segments })
            }

            // Now generate all images
            const result = await generateAllMutation.mutateAsync({
                videoId: request.videoId,
                style: request.visualStyle,
            })

            updateRequest({ segments: result.segments })
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("All images generated successfully!")
        } catch (error: any) {
            toast.error(error.message || "Failed to generate visuals")
        }
    }

    // Analyze script to get segments (without generating images)
    const handleAnalyzeScript = async () => {
        if (!request.videoId || !request.approvedScript || !request.audioDurationSeconds) {
            toast.error("Missing required data")
            return
        }

        try {
            const result = await analyzeVisualsMutation.mutateAsync({
                videoId: request.videoId,
                script: request.approvedScript.story,
                audioDurationSeconds: request.audioDurationSeconds,
            })

            updateRequest({ segments: result.segments })
            setShowRegenerateDialog(false)
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("Visual prompts generated successfully!")
        } catch (error: any) {
            toast.error(error.message || "Failed to analyze script")
        }
    }

    // Regenerate single segment
    const handleRegenerateSegment = async (segment: VisualSegment) => {
        if (!request.videoId) {
            toast.error("No video ID found")
            return
        }

        // Mark segment as generating
        const updatedSegments = request.segments.map(seg =>
            seg.id === segment.id ? { ...seg, isGenerating: true } : seg
        )
        updateRequest({ segments: updatedSegments })

        try {
            const result = await generateSegmentMutation.mutateAsync({
                videoId: request.videoId,
                segmentId: segment.id,
                prompt: segment.imagePrompt,
                style: request.visualStyle,
            })

            // Update segment with new image
            const finalSegments = request.segments.map(seg =>
                seg.id === segment.id
                    ? {
                        ...seg,
                        ...result.segment,
                        isGenerating: false,
                        generatedImageUrl: result.segment.imageUrl, // Legacy field
                    }
                    : seg
            )
            updateRequest({ segments: finalSegments })
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("Image regenerated!")
        } catch (error: any) {
            // Reset generating state
            const resetSegments = request.segments.map(seg =>
                seg.id === segment.id ? { ...seg, isGenerating: false } : seg
            )
            updateRequest({ segments: resetSegments })
            toast.error(error.message || "Failed to regenerate image")
        }
    }

    const updateSegmentPrompt = async (segmentId: string, newPrompt: string) => {
        // Optimistic update
        const updatedSegments = request.segments.map(seg =>
            seg.id === segmentId ? { ...seg, imagePrompt: newPrompt } : seg
        )
        updateRequest({ segments: updatedSegments })

        if (!request.videoId) return

        try {
            await updatePromptMutation.mutateAsync({
                videoId: request.videoId,
                segmentId,
                prompt: newPrompt
            })
            // No toast needed for auto-save unless error
        } catch (error) {
            console.error("Failed to save prompt:", error)
            toast.error("Failed to save prompt change")
        }
    }

    const isGeneratingAll = generateAllMutation.isPending || analyzeVisualsMutation.isPending
    const hasSegments = request.segments.length > 0

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
            <StepHeader
                title="Visual Generation"
                description="Generate and customize the images for each segment of your video."
            />

            {/* Warning if missing prerequisites */}
            {!canAnalyze && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-900">Complete previous steps first</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            {!hasVideoId && "No video created yet. "}
                            {!hasAudio && "Audio must be generated before creating visuals."}
                        </p>
                    </div>
                </div>
            )}

            {/* Generate All Button / Gallery Overview */}
            <ImageGallerySection
                segments={request.segments}
                expandedSegment={expandedSegment}
                onSegmentClick={(id) => setExpandedSegment(expandedSegment === id ? null : id)}
                isGeneratingAll={isGeneratingAll}
                canAnalyze={canAnalyze}
                onGenerateAll={handleGenerateAll}
                onAnalyzeScript={handleAnalyzeScript}
                onOpenRegeneratePrompts={() => setShowRegenerateDialog(true)}
                isAnalyzePending={analyzeVisualsMutation.isPending}
            />

            {/* Segment Cards */}
            {hasSegments && (
                <div className="space-y-4">
                    {request.segments.map((segment, index) => (
                        <SegmentCard
                            key={segment.id}
                            segment={segment}
                            index={index}
                            isExpanded={expandedSegment === segment.id}
                            onToggleExpand={() => setExpandedSegment(expandedSegment === segment.id ? null : segment.id)}
                            onUpdatePrompt={(newPrompt) => updateSegmentPrompt(segment.id, newPrompt)}
                            onPreview={(url, prompt) => setPreviewImage({ url, prompt })}
                            onRegenerate={() => handleRegenerateSegment(segment)}
                            hasVideoId={!!request.videoId}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <RegeneratePromptsDialog 
                open={showRegenerateDialog} 
                onOpenChange={setShowRegenerateDialog}
                onConfirm={handleAnalyzeScript}
                isAnalyzing={analyzeVisualsMutation.isPending}
            />

            <RegenerateImagesDialog
                open={showRegenerateImagesDialog}
                onOpenChange={setShowRegenerateImagesDialog}
                onConfirm={() => handleGenerateAll(true)}
                isGenerating={generateAllMutation.isPending}
                count={request.segments.filter(s => s.imageUrl || s.generatedImageUrl).length}
            />

            <ImagePreviewDialog
                open={!!previewImage}
                onOpenChange={(open) => !open && setPreviewImage(null)}
                imageUrl={previewImage?.url}
                prompt={previewImage?.prompt || ""}
            />
        </div>
    )
}
