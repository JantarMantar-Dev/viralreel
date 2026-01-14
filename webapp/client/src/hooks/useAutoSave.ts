import { useEffect, useRef, useCallback } from "react"
import { useUpdateVideoMetadata, UpdateVideoMetadataParams } from "./useEditorApi"

interface AutoSaveData {
    currentPhase?: "script" | "audio" | "visuals" | "subtitles" | "review"
    episodeTitle?: string
    scriptIdea?: string
    duration?: number
    visualStyle?: string
    voiceId?: string
    voiceName?: string
    tonePrompt?: string
    subtitleStyleId?: string
    subtitleStyleName?: string
    musicId?: string
    musicName?: string
}

interface UseAutoSaveOptions {
    /** Video ID to save to. If undefined, auto-save is disabled */
    videoId: string | undefined
    /** Data to auto-save */
    data: AutoSaveData
    /** Debounce delay in milliseconds (default: 2000) */
    debounceMs?: number
    /** Periodic save interval in milliseconds (default: 30000) */
    periodicSaveMs?: number
    /** Whether auto-save is enabled (default: true) */
    enabled?: boolean
    /** Callback when save succeeds */
    onSaveSuccess?: () => void
    /** Callback when save fails */
    onSaveError?: (error: Error) => void
}

interface UseAutoSaveReturn {
    /** Whether there are unsaved changes */
    isDirty: boolean
    /** Whether a save is currently in progress */
    isSaving: boolean
    /** Manually trigger a save */
    saveNow: () => void
    /** Last saved timestamp */
    lastSavedAt: Date | null
}

/**
 * Auto-save hook for Editor Mode
 * 
 * Features:
 * - Debounced saves (2s after last change by default)
 * - Periodic saves (every 30s if there are changes)
 * - Manual save trigger
 * - Dirty state tracking
 */
export function useAutoSave({
    videoId,
    data,
    debounceMs = 2000,
    periodicSaveMs = 30000,
    enabled = true,
    onSaveSuccess,
    onSaveError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
    const updateMetadata = useUpdateVideoMetadata()
    
    // Track the last saved data to detect changes
    const lastSavedDataRef = useRef<string>("")
    const lastSavedAtRef = useRef<Date | null>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const periodicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const isDirtyRef = useRef(false)

    // Serialize data for comparison
    const serializedData = JSON.stringify(data)
    const isDirty = serializedData !== lastSavedDataRef.current

    // Update dirty ref for use in periodic save
    isDirtyRef.current = isDirty

    const performSave = useCallback(async () => {
        if (!videoId || !enabled) return
        
        const currentData = JSON.parse(serializedData) as AutoSaveData
        
        // Filter out undefined values
        const metadata: UpdateVideoMetadataParams["metadata"] = {}
        if (currentData.currentPhase) metadata.currentPhase = currentData.currentPhase
        if (currentData.episodeTitle) metadata.episodeTitle = currentData.episodeTitle
        if (currentData.scriptIdea) metadata.scriptIdea = currentData.scriptIdea
        if (currentData.duration) metadata.duration = currentData.duration
        if (currentData.visualStyle) metadata.visualStyle = currentData.visualStyle
        if (currentData.voiceId) metadata.voiceId = currentData.voiceId
        if (currentData.voiceName) metadata.voiceName = currentData.voiceName
        if (currentData.tonePrompt) metadata.tonePrompt = currentData.tonePrompt
        if (currentData.subtitleStyleId) metadata.subtitleStyleId = currentData.subtitleStyleId
        if (currentData.subtitleStyleName) metadata.subtitleStyleName = currentData.subtitleStyleName
        if (currentData.musicId) metadata.musicId = currentData.musicId
        if (currentData.musicName) metadata.musicName = currentData.musicName

        // Don't save if no metadata to update
        if (Object.keys(metadata).length === 0) return

        try {
            await updateMetadata.mutateAsync({ videoId, metadata })
            lastSavedDataRef.current = serializedData
            lastSavedAtRef.current = new Date()
            isDirtyRef.current = false
            onSaveSuccess?.()
        } catch (error) {
            onSaveError?.(error as Error)
        }
    }, [videoId, serializedData, enabled, updateMetadata, onSaveSuccess, onSaveError])

    const saveNow = useCallback(() => {
        // Clear any pending debounced save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = null
        }
        performSave()
    }, [performSave])

    // Debounced save on data change
    useEffect(() => {
        if (!videoId || !enabled || !isDirty) return

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // Set new debounced save
        debounceTimerRef.current = setTimeout(() => {
            performSave()
        }, debounceMs)

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [videoId, enabled, isDirty, serializedData, debounceMs, performSave])

    // Periodic save
    useEffect(() => {
        if (!videoId || !enabled) return

        periodicTimerRef.current = setInterval(() => {
            if (isDirtyRef.current) {
                performSave()
            }
        }, periodicSaveMs)

        return () => {
            if (periodicTimerRef.current) {
                clearInterval(periodicTimerRef.current)
            }
        }
    }, [videoId, enabled, periodicSaveMs, performSave])

    // Save on unmount if dirty
    useEffect(() => {
        return () => {
            if (isDirtyRef.current && videoId && enabled) {
                // Sync save on unmount - best effort
                performSave()
            }
        }
    }, [videoId, enabled, performSave])

    return {
        isDirty,
        isSaving: updateMetadata.isPending,
        saveNow,
        lastSavedAt: lastSavedAtRef.current,
    }
}
