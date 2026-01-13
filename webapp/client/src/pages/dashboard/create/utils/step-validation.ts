/**
 * Step 2 Validation Utilities
 * 
 * This file contains validation logic for Step 2 (Script & Idea) of the
 * video creation wizard. Extracted into a separate file for:
 * - Better testability
 * - Reusability across components
 * - Separation of concerns
 */

import { VideoJobRequest } from './context/creation-context'

/**
 * Determines which required fields are missing for Step 2
 * 
 * @param request - The current video job request state
 * @param currentStep - The current step number in the wizard
 * @returns A user-friendly message listing missing fields, or null if all fields are valid
 * 
 * Validation rules for Step 2:
 * - Series Mode: Requires Series Name, Episode Title, and Script Idea
 * - Video Mode: Requires Video Name and Script Idea
 */
export function getMissingFieldsMessage(
    request: VideoJobRequest,
    currentStep: number
): string | null {
    // Only validate on step 2
    if (currentStep !== 2) return null
    
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

/**
 * Checks if the continue button should be disabled for Step 2
 * 
 * @param request - The current video job request state
 * @param currentStep - The current step number in the wizard
 * @returns true if the button should be disabled, false otherwise
 */
export function isStep2ContinueDisabled(
    request: VideoJobRequest,
    currentStep: number
): boolean {
    if (currentStep !== 2) return false
    
    return (
        !request.scriptIdea.trim() ||
        (request.jobType === 'series' && !request.seriesName.trim()) ||
        !request.episodeTitle.trim()
    )
}
