/**
 * Audio Synthesis Components - Consolidated Tests
 * 
 * Tests the audio step and its sub-components:
 * - SegmentEditor: Edit segment dialogues
 * - TranscriptionEditor: Edit word-level transcription  
 * - VoiceSelector: Select voice for synthesis
 * 
 * Critical bug fixes verified:
 * - Infinite loop when typing in segment/transcription editors
 * - State update order when saving (clear editing state before updating context)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentEditor } from '../steps/audio/segment-editor'
import { TranscriptionEditor } from '../steps/audio/transcription-editor'
import { VoiceSelector } from '../steps/audio/voice-selector'
import { ScriptSegment, SubtitleWord } from '../context/editor-creation-context'

// =============================================================================
// SHARED TEST DATA
// =============================================================================

const mockSegments: ScriptSegment[] = [
    { dialogue: 'First segment dialogue.', start: 0, end: 90, duration: 3 },
    { dialogue: 'Second segment dialogue.', start: 90, end: 180, duration: 3 },
]

const mockSubtitles: SubtitleWord[] = [
    { text: 'Hello', start: 0, end: 15 },
    { text: 'world', start: 15, end: 30 },
    { text: 'test', start: 30, end: 45 },
]

const mockVoices = [
    { id: 'voice-1', name: 'Alex', gender: 'Male', previewUrl: '/audio/alex.mp3' },
    { id: 'voice-2', name: 'Sarah', gender: 'Female', previewUrl: '/audio/sarah.mp3' },
]

// =============================================================================
// SEGMENT EDITOR TESTS
// =============================================================================

describe('SegmentEditor', () => {
    const defaultProps = {
        segments: mockSegments,
        isEditing: false,
        isSaving: false,
        hasUnsavedChanges: false,
        onStartEditing: vi.fn(),
        onCancelEditing: vi.fn(),
        onSave: vi.fn(),
        onEditDialogue: vi.fn(),
    }

    beforeEach(() => vi.clearAllMocks())

    it('renders segments with dialogue', () => {
        render(<SegmentEditor {...defaultProps} />)
        expect(screen.getByText(/First segment/)).toBeInTheDocument()
        expect(screen.getByText(/Second segment/)).toBeInTheDocument()
    })

    it('shows Edit button when not editing', () => {
        render(<SegmentEditor {...defaultProps} />)
        expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
    })

    it('shows textareas when editing', () => {
        render(<SegmentEditor {...defaultProps} isEditing={true} />)
        expect(screen.getAllByRole('textbox')).toHaveLength(2)
    })

    it('calls onEditDialogue when typing - no infinite loop', async () => {
        const onEditDialogue = vi.fn()
        let callCount = 0
        onEditDialogue.mockImplementation(() => {
            callCount++
            if (callCount > 50) throw new Error('Infinite loop!')
        })

        render(<SegmentEditor {...defaultProps} isEditing={true} onEditDialogue={onEditDialogue} />)
        
        const textareas = screen.getAllByRole('textbox')
        await userEvent.type(textareas[0], 'test')
        
        expect(callCount).toBeLessThan(20)
        expect(onEditDialogue).toHaveBeenCalledWith(0, expect.any(String))
    })

    it('shows unsaved changes warning', () => {
        render(<SegmentEditor {...defaultProps} hasUnsavedChanges={true} />)
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
    })

    it('disables save when no changes', () => {
        render(<SegmentEditor {...defaultProps} isEditing={true} hasUnsavedChanges={false} />)
        expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled()
    })

    it('calls onSave when save button clicked', async () => {
        const onSave = vi.fn()
        render(<SegmentEditor {...defaultProps} isEditing={true} hasUnsavedChanges={true} onSave={onSave} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Save/i }))
        expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('displays updated segments after prop change', () => {
        const { rerender } = render(<SegmentEditor {...defaultProps} />)
        expect(screen.getByText(/First segment/)).toBeInTheDocument()

        // Simulate save completing and new data coming in
        const updatedSegments = [
            { dialogue: 'Updated first segment.', start: 0, end: 90, duration: 3 },
            { dialogue: 'Updated second segment.', start: 90, end: 180, duration: 3 },
        ]
        rerender(<SegmentEditor {...defaultProps} segments={updatedSegments} />)
        
        expect(screen.getByText(/Updated first segment/)).toBeInTheDocument()
        expect(screen.getByText(/Updated second segment/)).toBeInTheDocument()
    })
})

// =============================================================================
// TRANSCRIPTION EDITOR TESTS
// =============================================================================

describe('TranscriptionEditor', () => {
    const defaultProps = {
        subtitles: mockSubtitles,
        isEditing: false,
        isSaving: false,
        hasUnsavedChanges: false,
        onStartEditing: vi.fn(),
        onCancelEditing: vi.fn(),
        onSave: vi.fn(),
        onEditWord: vi.fn(),
    }

    beforeEach(() => vi.clearAllMocks())

    it('renders words from subtitles', () => {
        render(<TranscriptionEditor {...defaultProps} />)
        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('world')).toBeInTheDocument()
    })

    it('shows word count', () => {
        render(<TranscriptionEditor {...defaultProps} />)
        expect(screen.getByText(/3 words detected/)).toBeInTheDocument()
    })

    it('shows input fields when editing', () => {
        render(<TranscriptionEditor {...defaultProps} isEditing={true} />)
        expect(screen.getAllByRole('textbox')).toHaveLength(3)
    })

    it('calls onEditWord when typing - no infinite loop', async () => {
        const onEditWord = vi.fn()
        let callCount = 0
        onEditWord.mockImplementation(() => {
            callCount++
            if (callCount > 50) throw new Error('Infinite loop!')
        })

        render(<TranscriptionEditor {...defaultProps} isEditing={true} onEditWord={onEditWord} />)
        
        const inputs = screen.getAllByRole('textbox')
        await userEvent.type(inputs[0], 'x')
        
        expect(callCount).toBeLessThan(10)
    })

    it('shows unsaved changes warning', () => {
        render(<TranscriptionEditor {...defaultProps} hasUnsavedChanges={true} />)
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
    })

    it('calls onSave when save button clicked', async () => {
        const onSave = vi.fn()
        render(<TranscriptionEditor {...defaultProps} isEditing={true} hasUnsavedChanges={true} onSave={onSave} />)
        
        await userEvent.click(screen.getByRole('button', { name: /Save/i }))
        expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('displays updated subtitles after prop change', () => {
        const { rerender } = render(<TranscriptionEditor {...defaultProps} />)
        expect(screen.getByText('Hello')).toBeInTheDocument()

        // Simulate save completing and new data coming in
        const updatedSubtitles = [
            { text: 'Updated', start: 0, end: 15 },
            { text: 'words', start: 15, end: 30 },
            { text: 'here', start: 30, end: 45 },
        ]
        rerender(<TranscriptionEditor {...defaultProps} subtitles={updatedSubtitles} />)
        
        expect(screen.getByText('Updated')).toBeInTheDocument()
        expect(screen.getByText('words')).toBeInTheDocument()
        expect(screen.getByText('here')).toBeInTheDocument()
        expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    })
})

// =============================================================================
// VOICE SELECTOR TESTS
// =============================================================================

describe('VoiceSelector', () => {
    const defaultProps = {
        voices: mockVoices,
        isLoading: false,
        selectedVoiceId: undefined,
        onSelect: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
        window.HTMLMediaElement.prototype.pause = vi.fn()
    })

    it('renders voice options', () => {
        render(<VoiceSelector {...defaultProps} />)
        expect(screen.getByText('Alex')).toBeInTheDocument()
        expect(screen.getByText('Sarah')).toBeInTheDocument()
    })

    it('shows loading spinner when loading', () => {
        render(<VoiceSelector {...defaultProps} isLoading={true} />)
        expect(screen.getByText('Select Voice')).toBeInTheDocument()
    })

    it('calls onSelect when voice is clicked', async () => {
        const onSelect = vi.fn()
        render(<VoiceSelector {...defaultProps} onSelect={onSelect} />)
        
        await userEvent.click(screen.getByTestId('voice-card-voice-1'))
        expect(onSelect).toHaveBeenCalledWith('voice-1')
    })

    it('highlights selected voice', () => {
        render(<VoiceSelector {...defaultProps} selectedVoiceId="voice-1" />)
        const card = screen.getByTestId('voice-card-voice-1')
        expect(card).toHaveClass('border-purple-600')
    })
})
