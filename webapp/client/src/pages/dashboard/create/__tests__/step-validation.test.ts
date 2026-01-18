/**
 * Step Validation Utilities Tests
 * 
 * These tests cover the validation logic for Step 2 (Script & Idea)
 * of the video creation wizard. The validation determines:
 * - Which fields are missing
 * - Whether the continue button should be disabled
 * - The appropriate error message to display
 */

import { describe, it, expect } from 'vitest'
import { getMissingFieldsMessage, isStep2ContinueDisabled } from '../utils/step-validation'
import { INITIAL_REQUEST, VideoJobRequest } from '../context/creation-context'

/**
 * Helper function to create a test request with overrides
 */
function createTestRequest(overrides: Partial<VideoJobRequest> = {}): VideoJobRequest {
    return {
        ...INITIAL_REQUEST,
        ...overrides,
    }
}

describe('getMissingFieldsMessage', () => {
    /**
     * ============================================
     * SECTION 1: Step Gating Tests
     * ============================================
     * These tests verify that validation only runs on Step 2.
     */
    describe('Step Gating', () => {
        it('should return null for step 1 (not step 2)', () => {
            /**
             * Feature: Step-Specific Validation
             * Validation should only apply to Step 2, not Step 1.
             */
            const request = createTestRequest({
                scriptIdea: '',
                seriesName: '',
                episodeTitle: ''
            })
            
            const result = getMissingFieldsMessage(request, 1)
            expect(result).toBeNull()
        })

        it('should return null for step 3 (not step 2)', () => {
            /**
             * Feature: Step-Specific Validation
             * Validation should only apply to Step 2, not Step 3+.
             */
            const request = createTestRequest({
                scriptIdea: '',
                seriesName: '',
                episodeTitle: ''
            })
            
            const result = getMissingFieldsMessage(request, 3)
            expect(result).toBeNull()
        })

        it('should validate on step 2', () => {
            /**
             * Feature: Step 2 Validation Active
             * Validation should return a message for Step 2 when fields are missing.
             */
            const request = createTestRequest({
                jobType: 'video',
                scriptIdea: '',
                episodeTitle: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).not.toBeNull()
        })
    })

    /**
     * ============================================
     * SECTION 2: Series Mode Validation Tests
     * ============================================
     * These tests verify validation behavior when creating a series.
     */
    describe('Series Mode Validation', () => {
        it('should detect missing series name', () => {
            /**
             * Feature: Series Name Requirement
             * When creating a series, the series name is required.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: '',
                episodeTitle: 'Episode Title',
                scriptIdea: 'Some idea'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Series Name')
        })

        it('should detect missing episode title', () => {
            /**
             * Feature: Episode Title Requirement
             * When creating a series, the episode title is required.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: 'Series Name',
                episodeTitle: '',
                scriptIdea: 'Some idea'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Episode Title')
        })

        it('should detect missing script idea', () => {
            /**
             * Feature: Script Idea Requirement
             * The script idea/context is always required.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: 'Series Name',
                episodeTitle: 'Episode Title',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Video Idea & Context')
        })

        it('should detect multiple missing fields in series mode', () => {
            /**
             * Feature: Multiple Missing Fields Message
             * When multiple fields are missing, all should be listed.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: '',
                episodeTitle: '',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required fields: Series Name, Episode Title, Video Idea & Context')
        })

        it('should return null when all series fields are filled', () => {
            /**
             * Feature: Valid Series Form
             * When all fields are filled, no error message should be returned.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: 'My Series',
                episodeTitle: 'Episode 1',
                scriptIdea: 'A great idea for my video'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBeNull()
        })

        it('should treat whitespace-only series name as empty', () => {
            /**
             * Feature: Whitespace Trimming
             * Fields containing only whitespace should be treated as empty.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: '   ',
                episodeTitle: 'Episode Title',
                scriptIdea: 'Some idea'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Series Name')
        })

        it('should treat whitespace-only episode title as empty', () => {
            /**
             * Feature: Whitespace Trimming
             * Fields containing only whitespace should be treated as empty.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: 'Series Name',
                episodeTitle: '\t\n  ',
                scriptIdea: 'Some idea'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Episode Title')
        })
    })

    /**
     * ============================================
     * SECTION 3: Video Mode Validation Tests
     * ============================================
     * These tests verify validation behavior when creating a single video.
     */
    describe('Video Mode Validation', () => {
        it('should detect missing video name', () => {
            /**
             * Feature: Video Name Requirement
             * When creating a single video, the video name is required.
             */
            const request = createTestRequest({
                jobType: 'video',
                seriesName: '',
                episodeTitle: '',
                scriptIdea: 'Some idea'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Video Name')
        })

        it('should detect missing script idea in video mode', () => {
            /**
             * Feature: Script Idea Requirement (Video Mode)
             * The script idea is required for single videos too.
             */
            const request = createTestRequest({
                jobType: 'video',
                seriesName: '',
                episodeTitle: 'My Video',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required field: Video Idea & Context')
        })

        it('should detect multiple missing fields in video mode', () => {
            /**
             * Feature: Multiple Missing Fields in Video Mode
             * When creating a video, both video name and idea can be missing.
             */
            const request = createTestRequest({
                jobType: 'video',
                seriesName: '',
                episodeTitle: '',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBe('Missing required fields: Video Name, Video Idea & Context')
        })

        it('should NOT check series name in video mode', () => {
            /**
             * Feature: Video Mode Ignores Series Name
             * When creating a single video, series name is not required.
             */
            const request = createTestRequest({
                jobType: 'video',
                seriesName: '', // Empty series name should not matter
                episodeTitle: 'My Video',
                scriptIdea: 'A great video idea'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBeNull()
        })

        it('should return null when all video fields are filled', () => {
            /**
             * Feature: Valid Video Form
             * When all required video fields are filled, no error.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: 'My Amazing Video',
                scriptIdea: 'This video is about...'
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toBeNull()
        })
    })

    /**
     * ============================================
     * SECTION 4: Message Formatting Tests
     * ============================================
     * These tests verify the grammar and formatting of error messages.
     */
    describe('Message Formatting', () => {
        it('should use singular "field" for one missing field', () => {
            /**
             * Feature: Proper Grammar - Singular
             * Error message should use "field" (singular) for one missing field.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: 'Title',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toContain('Missing required field:')
            expect(result).not.toContain('fields')
        })

        it('should use plural "fields" for multiple missing fields', () => {
            /**
             * Feature: Proper Grammar - Plural
             * Error message should use "fields" (plural) for multiple missing fields.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: '',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toContain('Missing required fields:')
        })

        it('should separate fields with commas', () => {
            /**
             * Feature: Comma-Separated Fields
             * Multiple fields should be listed with comma separation.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: '',
                episodeTitle: '',
                scriptIdea: ''
            })
            
            const result = getMissingFieldsMessage(request, 2)
            expect(result).toContain('Series Name, Episode Title, Video Idea & Context')
        })
    })
})

describe('isStep2ContinueDisabled', () => {
    /**
     * ============================================
     * SECTION 1: Basic Disabled State Tests
     * ============================================
     * These tests verify when the continue button should be disabled.
     */
    describe('Disabled State', () => {
        it('should return false for steps other than 2', () => {
            /**
             * Feature: Step-Specific Behavior
             * Button should not be disabled by this function on other steps.
             */
            const request = createTestRequest({
                scriptIdea: '',
                episodeTitle: ''
            })
            
            expect(isStep2ContinueDisabled(request, 1)).toBe(false)
            expect(isStep2ContinueDisabled(request, 3)).toBe(false)
        })

        it('should return true when script idea is empty (video mode)', () => {
            /**
             * Feature: Script Idea Required for Continue
             * Button should be disabled when script idea is empty.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: 'Title',
                scriptIdea: ''
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(true)
        })

        it('should return true when episode title is empty (video mode)', () => {
            /**
             * Feature: Video Name Required for Continue
             * Button should be disabled when video name (episodeTitle) is empty.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: '',
                scriptIdea: 'Some idea'
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(true)
        })

        it('should return true when series name is empty (series mode)', () => {
            /**
             * Feature: Series Name Required for Continue
             * Button should be disabled when series name is empty in series mode.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: '',
                episodeTitle: 'Episode',
                scriptIdea: 'Some idea'
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(true)
        })
    })

    /**
     * ============================================
     * SECTION 2: Enabled State Tests
     * ============================================
     * These tests verify when the continue button should be enabled.
     */
    describe('Enabled State', () => {
        it('should return false when all video fields are filled', () => {
            /**
             * Feature: Valid Video Form Enables Button
             * Button should be enabled when all video fields are valid.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: 'My Video',
                scriptIdea: 'A great idea'
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(false)
        })

        it('should return false when all series fields are filled', () => {
            /**
             * Feature: Valid Series Form Enables Button
             * Button should be enabled when all series fields are valid.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: 'My Series',
                episodeTitle: 'Episode 1',
                scriptIdea: 'A great idea'
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(false)
        })
    })

    /**
     * ============================================
     * SECTION 3: Whitespace Handling Tests
     * ============================================
     * These tests verify that whitespace-only input is treated as empty.
     */
    describe('Whitespace Handling', () => {
        it('should treat whitespace-only script idea as empty', () => {
            /**
             * Feature: Whitespace Trimming for Script Idea
             * Script idea with only spaces should disable the button.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: 'Title',
                scriptIdea: '   \t\n   '
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(true)
        })

        it('should treat whitespace-only episode title as empty', () => {
            /**
             * Feature: Whitespace Trimming for Episode Title
             * Episode title with only spaces should disable the button.
             */
            const request = createTestRequest({
                jobType: 'video',
                episodeTitle: '   ',
                scriptIdea: 'Some idea'
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(true)
        })

        it('should treat whitespace-only series name as empty', () => {
            /**
             * Feature: Whitespace Trimming for Series Name
             * Series name with only spaces should disable the button.
             */
            const request = createTestRequest({
                jobType: 'series',
                seriesName: '\t\n',
                episodeTitle: 'Episode',
                scriptIdea: 'Some idea'
            })
            
            expect(isStep2ContinueDisabled(request, 2)).toBe(true)
        })
    })
})
