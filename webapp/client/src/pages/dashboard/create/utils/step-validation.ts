/**
 * Step Validation Utilities
 * 
 * This file contains validation logic for the video creation wizard steps.
 * Extracted into a separate file for:
 * - Better testability
 * - Reusability across components
 * - Separation of concerns
 */

import { VideoJobRequest } from '../context/creation-context'

/**
 * Determines which required fields are missing for the current step
 * 
 * @param request - The current video job request state
 * @param currentStep - The current step number in the wizard
 * @param currentPath - The current route path (optional, used for path-based checking)
 * @returns A user-friendly message listing missing fields, or null if all fields are valid
 */
export function getMissingFieldsMessage(
    request: VideoJobRequest,
    currentStep: number,
    currentPath?: string
): string | null {
    // Script step validation
    const isScriptStep = currentPath === 'script' || currentStep === 2
    if (isScriptStep) {
        const missingFields: string[] = []
        
        // Series mode requires series name
        if (request.jobType === 'series' && !request.seriesName.trim()) {
            missingFields.push('Series Name')
        }
        
        // Video mode requires video name (stored in episodeTitle)
        if (request.jobType !== 'series' && !request.episodeTitle.trim()) {
            missingFields.push('Video Name')
        }
        
        // Series mode requires episode title
        if (request.jobType === 'series' && !request.episodeTitle.trim()) {
            missingFields.push('Episode Title')
        }
        
        // Both modes require script idea
        if (!request.scriptIdea.trim()) {
            missingFields.push('Video Idea & Context')
        }
        
        // No missing fields
        if (missingFields.length === 0) return null
        
        // Format the message with proper pluralization
        return `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`
    }
    
    // Script editor step validation
    const isScriptEditorStep = currentPath === 'script-editor'
    if (isScriptEditorStep) {
        if (!request.generatedScript) {
            return 'Generate a script first before continuing'
        }
    }
    
    return null
}

/**
 * Checks if the continue button should be disabled for Step 2
 * 
 * @param request - The current video job request state
 * @param currentStep - The current step number in the wizard
 * @param currentPath - The current route path (optional, used for path-based checking)
 * @returns true if the button should be disabled, false otherwise
 */
export function isStep2ContinueDisabled(
    request: VideoJobRequest,
    currentStep: number,
    currentPath?: string
): boolean {
    const isScriptStep = currentPath === 'script' || currentStep === 2
    if (!isScriptStep) return false
    
    return (
        !request.scriptIdea.trim() ||
        (request.jobType === 'series' && !request.seriesName.trim()) ||
        !request.episodeTitle.trim()
    )
}
