import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"
import { useEditorCreation, VisualSegment } from "../context/editor-creation-context"
import StepHeader from "../../create/components/step-header"
import { useAnalyzeVisuals, useGenerateSegmentImage, useGenerateAllImages, useUpdateSegmentPrompt, useEditorVideo } from "@/hooks/useEditorApi"
import { useQueryClient } from "@tanstack/react-query"
import { ImageGallerySection } from "./visuals/image-gallery"
import { SegmentCard } from "./visuals/segment-card"
import { RegeneratePromptsDialog, RegenerateImagesDialog, ImagePreviewDialog } from "./visuals/dialogs"

export default function EditorVisualsStep() {
    const { request, updateRequest } = useEditorCreation()
    const [expandedSegment, setExpandedSegment] = useState<string | null>(null)
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
    const [showRegenerateImagesDialog, setShowRegenerateImagesDialog] = useState(false)
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const videoIdParam = searchParams.get("videoId")
    const { data: videoData } = useEditorVideo(videoIdParam || undefined)

    // Sync data if missing from request but available in videoData
    useEffect(() => {
        if (videoData?.video && videoIdParam) {
            const video = videoData.video
            
            const updates: any = {}
            let hasUpdates = false

            // Sync segments if missing - API flattens segments to top level
            const videoSegments = video.segments || []
            if (request.segments.length === 0 && videoSegments.length > 0) {
                updates.segments = videoSegments
                hasUpdates = true
            }

            // Sync other required fields for visuals
            if (!request.audioDurationSeconds && video.audioDurationSeconds) {
                updates.audioDurationSeconds = video.audioDurationSeconds
                hasUpdates = true
            }

            if (!request.approvedScript && video.approvedScript) {
                updates.approvedScript = video.approvedScript
                hasUpdates = true
            }

            if (!request.audioUrl && video.audioUrl) {
                updates.audioUrl = video.audioUrl
                hasUpdates = true
            }

            // Sync audio versions if missing (needed to get script for selected audio version)
            if (request.audioVersions.length === 0 && video.audioVersions && video.audioVersions.length > 0) {
                updates.audioVersions = video.audioVersions
                hasUpdates = true
            }

            // Sync selected audio ID if missing
            if (!request.selectedAudioId && video.selectedAudioId) {
                updates.selectedAudioId = video.selectedAudioId
                hasUpdates = true
            }

            // Sync image generation status
            if (video.imageGenerationStatus && video.imageGenerationStatus !== request.imageGenerationStatus) {
                updates.imageGenerationStatus = video.imageGenerationStatus
                hasUpdates = true
            }

            if (hasUpdates) {
                updateRequest(updates)
            }
        }
    }, [videoData, videoIdParam, request.segments.length, request.audioDurationSeconds, request.approvedScript, request.audioUrl, request.audioVersions.length, request.selectedAudioId, request.imageGenerationStatus, updateRequest])

    // Poll for status if generating
    useEffect(() => {
        if (request.imageGenerationStatus === 'GENERATING' && request.videoId) {
            const interval = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [request.imageGenerationStatus, request.videoId, queryClient])

    // API hooks
    const analyzeVisualsMutation = useAnalyzeVisuals()
    const generateSegmentMutation = useGenerateSegmentImage()
    const generateAllMutation = useGenerateAllImages()
    const updatePromptMutation = useUpdateSegmentPrompt()

    // Check if we have required data
    const hasVideoId = !!request.videoId
    const hasAudio = !!request.audioUrl && !!request.audioDurationSeconds
    
    // Get the selected audio version to use its script
    const selectedAudioVersion = request.audioVersions.find(v => v.id === request.selectedAudioId)
    // Use script from selected audio version, fallback to approvedScript for backward compatibility
    const scriptForVisuals = selectedAudioVersion?.script || request.approvedScript?.story
    const canAnalyze = hasVideoId && hasAudio && !!scriptForVisuals

    // Generate all images mutation handler
    const handleGenerateAll = async (skipConfirmation = false) => {
        if (!request.videoId) {
            toast.error("No video ID found. Please go back to the Audio step.")
            return
        }

        if (!scriptForVisuals || !request.audioDurationSeconds) {
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
                    segments: request.segments || [],
                })

                updateRequest({ segments: analyzeResult.segments })
            }

            // Now generate all images
            const result = await generateAllMutation.mutateAsync({
                videoId: request.videoId,
                style: request.visualStyle,
            })

            updateRequest({ 
                segments: result.segments,
                imageGenerationStatus: 'GENERATING'
            })
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            toast.success("Image generation started. This may take a few moments.")
        } catch (error: any) {
            toast.error(error.message || "Failed to generate visuals")
        }
    }

    // Analyze script to get segments (without generating images)
    const handleAnalyzeScript = async () => {
        if (!request.videoId) {
            toast.error("Missing required data")
            return
        }

        try {
            const result = await analyzeVisualsMutation.mutateAsync({
                videoId: request.videoId,
                segments: request.segments || [],
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

        // Validate that segment has an imagePrompt
        const prompt = segment.imagePrompt?.trim()
        if (!prompt) {
            toast.error("Image prompt is required. Please add a prompt for this segment first.")
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
                prompt: prompt,
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
            
            // Invalidate cache so returning to this page shows fresh data
            queryClient.invalidateQueries({ queryKey: ["editor-video", request.videoId] })
            
            // No toast needed for auto-save unless error
        } catch (error) {
            console.error("Failed to save prompt:", error)
            toast.error("Failed to save prompt change")
        }
    }

    const isGeneratingAll = generateAllMutation.isPending || 
                            analyzeVisualsMutation.isPending || 
                            request.imageGenerationStatus === 'GENERATING'
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
                onPreview={(index) => setPreviewIndex(index)}
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
                            onPreview={() => setPreviewIndex(index)}
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
                open={previewIndex !== null}
                onOpenChange={(open) => !open && setPreviewIndex(null)}
                segments={request.segments}
                initialIndex={previewIndex || 0}
            />
        </div>
    )
}
