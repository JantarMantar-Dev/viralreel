import { 
    Volume2, 
    Play, 
    Pause, 
    CheckCircle2, 
    FileText, 
    AlertCircle, 
    Scissors, 
    Clock, 
    Check, 
    Loader2, 
    RefreshCw 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AudioVersion } from "../../../context/editor-creation-context"

interface AudioVersionListProps {
    versions: AudioVersion[]
    selectedId: string | undefined
    playingVersionId: string | null
    onPlayPause: (version: AudioVersion) => void
    onSelect: (version: AudioVersion) => void
    onGenerateTranscription: (versionId: string) => void
    onGenerateSegments: (versionId: string) => void
    onSynthesizeAudio: () => void
    isSynthesizing: boolean
    isTranscribing: boolean
    isSegmenting: boolean
    transcribingAudioId?: string
    segmentingAudioId?: string
    transcriptionError: string | null
    segmentationError: string | null
    onRetryTranscription: () => void
    onRetrySegmentation: () => void
    selectedVoiceId: string | undefined
}

export function AudioVersionList({
    versions,
    selectedId,
    playingVersionId,
    onPlayPause,
    onSelect,
    onGenerateTranscription,
    onGenerateSegments,
    onSynthesizeAudio,
    isSynthesizing,
    isTranscribing,
    isSegmenting,
    transcribingAudioId,
    segmentingAudioId,
    transcriptionError,
    segmentationError,
    onRetryTranscription,
    onRetrySegmentation,
    selectedVoiceId
}: AudioVersionListProps) {
    
    // Format duration for display
    const formatDuration = (seconds: number | undefined) => {
        if (!seconds) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const selectedVersion = versions.find(v => v.id === selectedId)
    const needsTranscription = selectedVersion && (!selectedVersion.subtitles || selectedVersion.subtitles.length === 0)

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                    <Volume2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">Generated Audio Versions</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        {versions.length} version{versions.length > 1 ? 's' : ''} generated. 
                        Click to play, or select the one you want to use.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {versions.slice().reverse().map((version, index) => {
                    const isSelected = version.id === selectedId
                    const isPlaying = playingVersionId === version.id
                    const versionNumber = versions.length - index
                    const hasTranscription = version.subtitles && version.subtitles.length > 0
                    const hasSegments = version.segments && version.segments.length > 0
                    const isTranscribingThis = isTranscribing && transcribingAudioId === version.id
                    const isSegmentingThis = isSegmenting && segmentingAudioId === version.id

                    return (
                        <div
                            key={version.id}
                            className={cn(
                                "relative p-4 rounded-2xl border-2 transition-all duration-200",
                                isSelected
                                    ? "border-green-500 bg-green-50/50 shadow-sm"
                                    : "border-slate-100 bg-slate-50/30 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                {/* Play/Pause Button */}
                                <button
                                    onClick={() => onPlayPause(version)}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0",
                                        isPlaying 
                                            ? "bg-purple-600 text-white hover:bg-purple-700" 
                                            : "bg-white text-purple-600 hover:bg-purple-50 border-2 border-purple-200"
                                    )}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5 ml-0.5" />
                                    )}
                                </button>

                                {/* Version Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-slate-900">
                                            Version {versionNumber}
                                        </span>
                                        {isSelected && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Selected
                                            </span>
                                        )}
                                        {hasTranscription ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                                <FileText className="h-3 w-3" />
                                                Transcribed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                                <AlertCircle className="h-3 w-3" />
                                                No transcription
                                            </span>
                                        )}
                                        {hasSegments && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                                                <Scissors className="h-3 w-3" />
                                                Segmented
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDuration(version.durationSeconds)}
                                        </span>
                                        <span>
                                            {version.voiceName}
                                        </span>
                                        {version.tonePrompt && (
                                            <span className="truncate max-w-[150px]" title={version.tonePrompt}>
                                                "{version.tonePrompt}"
                                            </span>
                                        )}
                                        <span className="text-slate-400">
                                            {formatDate(version.generatedAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Select Button (only show if not already selected) */}
                                    {!isSelected && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onSelect(version)}
                                            className="gap-1.5 rounded-xl border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                        >
                                            <Check className="h-4 w-4" />
                                            Use This
                                        </Button>
                                    )}
                                    {/* Get Transcription Button (show for selected version without transcription) */}
                                    {isSelected && !hasTranscription && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => onGenerateTranscription(version.id)}
                                            disabled={isTranscribingThis}
                                            className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isTranscribingThis ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Transcribing...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="h-4 w-4" />
                                                    Get Transcription
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    {/* Generate Segments Button (show for selected version with transcription but no segments) */}
                                    {isSelected && hasTranscription && !hasSegments && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => onGenerateSegments(version.id)}
                                            disabled={isSegmentingThis}
                                            className="gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700"
                                        >
                                            {isSegmentingThis ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Segmenting...
                                                </>
                                            ) : (
                                                <>
                                                    <Scissors className="h-4 w-4" />
                                                    Segment
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Audio Waveform Visualization (when playing) */}
                            {isPlaying && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1 h-6">
                                        {Array.from({ length: 50 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 rounded-full bg-purple-500 animate-pulse"
                                                style={{
                                                    height: `${20 + Math.random() * 80}%`,
                                                    animationDelay: `${i * 30}ms`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Transcription Error Display */}
            {transcriptionError && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-red-800">Transcription Failed</h4>
                            <p className="text-sm text-red-600 mt-1">{transcriptionError}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetryTranscription}
                                disabled={isTranscribing || !selectedId}
                                className="mt-3 gap-1.5 rounded-lg border-red-200 text-red-700 hover:bg-red-100"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Retry Transcription
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transcription Required Notice */}
            {needsTranscription && !transcriptionError && !isTranscribing && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-800">Transcription Required</h4>
                            <p className="text-sm text-amber-600 mt-1">
                                Click "Get Transcription" on the selected audio version to generate word-level subtitles. 
                                This is required before proceeding to the next step.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Segmentation Error Display */}
            {segmentationError && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-red-800">Segmentation Failed</h4>
                            <p className="text-sm text-red-600 mt-1">{segmentationError}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetrySegmentation}
                                disabled={isSegmenting || !selectedId}
                                className="mt-3 gap-1.5 rounded-lg border-red-200 text-red-700 hover:bg-red-100"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Retry Segmentation
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate New Version Button */}
            <div className="mt-6">
                <Button
                    variant="outline"
                    onClick={onSynthesizeAudio}
                    disabled={isSynthesizing || !selectedVoiceId}
                    className="w-full h-12 gap-2 rounded-xl border-2"
                >
                    {isSynthesizing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Generate New Version
                </Button>
            </div>
        </div>
    )
}
