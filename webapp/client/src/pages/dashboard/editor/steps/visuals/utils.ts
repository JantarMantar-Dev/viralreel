import { VisualSegment } from "../../context/editor-creation-context"

export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Get time from segment (handle both new and legacy format)
export const getSegmentStartTime = (segment: VisualSegment): number => {
    if (segment.timeRange) return segment.timeRange[0]
    return segment.startTime || 0
}

export const getSegmentEndTime = (segment: VisualSegment): number => {
    if (segment.timeRange) return segment.timeRange[1]
    return segment.endTime || 0
}

// Get image URL (handle both new and legacy format)
export const getSegmentImageUrl = (segment: VisualSegment): string | undefined => {
    return segment.imageUrl || segment.generatedImageUrl
}
