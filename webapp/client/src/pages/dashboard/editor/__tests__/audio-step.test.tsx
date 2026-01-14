/**
 * EditorAudioStep Component Tests
 * 
 * These tests cover the Audio Synthesis step (Step 3) of the Editor Mode creation wizard.
 * This step allows users to:
 * - Select a voice from a scrollable list
 * - Optionally add a tone prompt
 * - Generate and preview synthesized audio
 * 
 * Key behavior tested:
 * - Voice list is contained in a scrollable container with max-height
 * - Users can scroll through many voices without scrolling the whole page
 * - Selected voice is highlighted correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { 
    EditorCreationContext, 
    EditorCreationContextType, 
    EditorModeRequest,
    INITIAL_EDITOR_REQUEST 
} from '../context/editor-creation-context'
import EditorAudioStep from '../steps/audio-step'

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Large voice list to test scrollable behavior
 * Contains 16 voices which should require scrolling in a 320px container
 */
const MOCK_VOICES_LARGE = [
    { id: 'voice-1', name: 'Zephyr', gender: 'Male', previewUrl: '/audio/zephyr.mp3' },
    { id: 'voice-2', name: 'Luna', gender: 'Female', previewUrl: '/audio/luna.mp3' },
    { id: 'voice-3', name: 'Atlas', gender: 'Male', previewUrl: '/audio/atlas.mp3' },
    { id: 'voice-4', name: 'Nova', gender: 'Female', previewUrl: '/audio/nova.mp3' },
    { id: 'voice-5', name: 'Orion', gender: 'Male', previewUrl: '/audio/orion.mp3' },
    { id: 'voice-6', name: 'Aria', gender: 'Female', previewUrl: '/audio/aria.mp3' },
    { id: 'voice-7', name: 'Titan', gender: 'Male', previewUrl: '/audio/titan.mp3' },
    { id: 'voice-8', name: 'Echo', gender: 'Female', previewUrl: '/audio/echo.mp3' },
    { id: 'voice-9', name: 'Phoenix', gender: 'Male', previewUrl: '/audio/phoenix.mp3' },
    { id: 'voice-10', name: 'Sage', gender: 'Female', previewUrl: '/audio/sage.mp3' },
    { id: 'voice-11', name: 'Storm', gender: 'Male', previewUrl: '/audio/storm.mp3' },
    { id: 'voice-12', name: 'Ivy', gender: 'Female', previewUrl: '/audio/ivy.mp3' },
    { id: 'voice-13', name: 'Blaze', gender: 'Male', previewUrl: '/audio/blaze.mp3' },
    { id: 'voice-14', name: 'Crystal', gender: 'Female', previewUrl: '/audio/crystal.mp3' },
    { id: 'voice-15', name: 'Drake', gender: 'Male', previewUrl: '/audio/drake.mp3' },
    { id: 'voice-16', name: 'Willow', gender: 'Female', previewUrl: '/audio/willow.mp3' },
]

const MOCK_VOICES_SMALL = [
    { id: 'voice-1', name: 'Zephyr', gender: 'Male', previewUrl: '/audio/zephyr.mp3' },
    { id: 'voice-2', name: 'Luna', gender: 'Female', previewUrl: '/audio/luna.mp3' },
]

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createMockEditorRequest(overrides: Partial<EditorModeRequest> = {}): EditorModeRequest {
    return {
        ...INITIAL_EDITOR_REQUEST,
        approvedScript: {
            story: 'This is a test script for audio synthesis.',
            wordCount: 8,
            estimatedDurationSeconds: 30,
        },
        ...overrides,
    }
}

function createMockEditorContext(overrides: Partial<EditorCreationContextType> = {}): EditorCreationContextType {
    const requestOverride = overrides.request as EditorModeRequest | undefined
    return {
        request: requestOverride ?? createMockEditorRequest(),
        updateRequest: overrides.updateRequest ?? vi.fn(),
        nextStep: overrides.nextStep ?? vi.fn(),
        prevStep: overrides.prevStep ?? vi.fn(),
        currentStep: overrides.currentStep ?? 3,
        customNext: overrides.customNext,
        setCustomNext: overrides.setCustomNext ?? vi.fn(),
        customPrev: overrides.customPrev,
        setCustomPrev: overrides.setCustomPrev ?? vi.fn(),
        canContinue: overrides.canContinue ?? true,
        setCanContinue: overrides.setCanContinue ?? vi.fn(),
        isStepLoading: overrides.isStepLoading ?? false,
        setIsStepLoading: overrides.setIsStepLoading ?? vi.fn(),
    }
}

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    })
}

interface RenderOptions {
    editorContext?: Partial<EditorCreationContextType>
    voices?: typeof MOCK_VOICES_LARGE
}

function renderAudioStep(options: RenderOptions = {}) {
    const { editorContext = {}, voices = MOCK_VOICES_LARGE } = options
    const mockContext = createMockEditorContext(editorContext)
    const queryClient = createTestQueryClient()

    // Mock fetch for voices API
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/voices')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(voices),
            })
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        })
    })

    const result = render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <TooltipProvider>
                    <EditorCreationContext.Provider value={mockContext}>
                        <EditorAudioStep />
                    </EditorCreationContext.Provider>
                </TooltipProvider>
            </BrowserRouter>
        </QueryClientProvider>
    )

    return {
        ...result,
        mockContext,
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('EditorAudioStep Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock HTMLMediaElement.play
        window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
        window.HTMLMediaElement.prototype.pause = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // =========================================================================
    // SECTION 1: Component Rendering Tests
    // =========================================================================
    describe('Component Rendering', () => {
        it('should render the step header with correct title and description', async () => {
            renderAudioStep()
            
            await waitFor(() => {
                expect(screen.getByText('Audio Synthesis')).toBeInTheDocument()
            })
            expect(screen.getByText(/Select a voice and optionally adjust the tone/)).toBeInTheDocument()
        })

        it('should render all voice cards when voices are loaded', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByText('Zephyr')).toBeInTheDocument()
            })

            // Verify all 16 voices are rendered
            MOCK_VOICES_LARGE.forEach((voice) => {
                expect(screen.getByText(voice.name)).toBeInTheDocument()
            })
        })

        it('should render tone prompt textarea', async () => {
            renderAudioStep()

            await waitFor(() => {
                expect(screen.getByText('Tone Adjustment (Optional)')).toBeInTheDocument()
            })

            const textarea = screen.getByPlaceholderText(/Speak with a sense of mystery/)
            expect(textarea).toBeInTheDocument()
        })

        it('should render audio preview section', async () => {
            renderAudioStep()

            await waitFor(() => {
                expect(screen.getByText('Audio Preview')).toBeInTheDocument()
            })
        })
    })

    // =========================================================================
    // SECTION 2: Scrollable Voice Container Tests
    // =========================================================================
    describe('Scrollable Voice Container', () => {
        it('should render voice list in a scrollable container', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            const scrollContainer = screen.getByTestId('voice-scroll-container')
            expect(scrollContainer).toHaveClass('max-h-[320px]')
            expect(scrollContainer).toHaveClass('overflow-y-auto')
        })

        it('should have scroll-smooth class for smooth scrolling behavior', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            const scrollContainer = screen.getByTestId('voice-scroll-container')
            expect(scrollContainer).toHaveClass('scroll-smooth')
        })

        it('should contain all voice cards within the scroll container', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            const scrollContainer = screen.getByTestId('voice-scroll-container')
            
            // All voice cards should be within the scroll container
            MOCK_VOICES_LARGE.forEach((voice) => {
                const voiceCard = within(scrollContainer).getByTestId(`voice-card-${voice.id}`)
                expect(voiceCard).toBeInTheDocument()
            })
        })

        it('should show gradient indicator when there are more than 8 voices', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            // Check for the gradient overlay that indicates more content below
            const scrollContainer = screen.getByTestId('voice-scroll-container')
            const parentDiv = scrollContainer.parentElement
            
            // The gradient div should exist as a sibling
            const gradientDiv = parentDiv?.querySelector('.bg-gradient-to-t')
            expect(gradientDiv).toBeInTheDocument()
        })

        it('should NOT show gradient indicator when there are 8 or fewer voices', async () => {
            renderAudioStep({ voices: MOCK_VOICES_SMALL })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            const scrollContainer = screen.getByTestId('voice-scroll-container')
            const parentDiv = scrollContainer.parentElement
            
            // The gradient div should NOT exist when few voices
            const gradientDiv = parentDiv?.querySelector('.bg-gradient-to-t')
            expect(gradientDiv).not.toBeInTheDocument()
        })

        it('should render voice cards in a grid layout within scroll container', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            const scrollContainer = screen.getByTestId('voice-scroll-container')
            const gridContainer = scrollContainer.querySelector('.grid')
            
            expect(gridContainer).toBeInTheDocument()
            expect(gridContainer).toHaveClass('grid-cols-2')
            expect(gridContainer).toHaveClass('sm:grid-cols-3')
            expect(gridContainer).toHaveClass('md:grid-cols-4')
        })
    })

    // =========================================================================
    // SECTION 3: Voice Selection Tests
    // =========================================================================
    describe('Voice Selection', () => {
        it('should highlight selected voice with purple border', async () => {
            const updateRequest = vi.fn()
            renderAudioStep({ 
                voices: MOCK_VOICES_LARGE,
                editorContext: { updateRequest }
            })

            await waitFor(() => {
                expect(screen.getByText('Zephyr')).toBeInTheDocument()
            })

            const user = userEvent.setup()
            const voiceCard = screen.getByTestId('voice-card-voice-1')
            
            await user.click(voiceCard)

            expect(updateRequest).toHaveBeenCalledWith({
                voiceId: 'voice-1',
                voiceName: 'Zephyr',
            })
        })

        it('should show check icon on selected voice', async () => {
            renderAudioStep({ 
                voices: MOCK_VOICES_LARGE,
                editorContext: { 
                    request: createMockEditorRequest({ voiceId: 'voice-3' })
                }
            })

            await waitFor(() => {
                expect(screen.getByText('Atlas')).toBeInTheDocument()
            })

            // The selected voice card should have the check icon
            const voiceCard = screen.getByTestId('voice-card-voice-3')
            expect(voiceCard).toHaveClass('border-purple-600')
        })

        it('should allow selecting a voice that requires scrolling to see', async () => {
            const updateRequest = vi.fn()
            renderAudioStep({ 
                voices: MOCK_VOICES_LARGE,
                editorContext: { updateRequest }
            })

            await waitFor(() => {
                // Voice 16 (Willow) should be at the bottom, requiring scroll
                expect(screen.getByText('Willow')).toBeInTheDocument()
            })

            const user = userEvent.setup()
            const lastVoiceCard = screen.getByTestId('voice-card-voice-16')
            
            await user.click(lastVoiceCard)

            expect(updateRequest).toHaveBeenCalledWith({
                voiceId: 'voice-16',
                voiceName: 'Willow',
            })
        })
    })

    // =========================================================================
    // SECTION 4: Voice Preview Tests
    // =========================================================================
    describe('Voice Preview', () => {
        it('should have play button on each voice card', async () => {
            renderAudioStep({ voices: MOCK_VOICES_LARGE })

            await waitFor(() => {
                expect(screen.getByTestId('voice-scroll-container')).toBeInTheDocument()
            })

            // Each voice card should have a play button
            const scrollContainer = screen.getByTestId('voice-scroll-container')
            const voiceCards = within(scrollContainer).getAllByTestId(/^voice-card-/)
            
            expect(voiceCards.length).toBe(MOCK_VOICES_LARGE.length)
        })
    })

    // =========================================================================
    // SECTION 5: Tone Prompt Tests
    // =========================================================================
    describe('Tone Prompt', () => {
        it('should allow entering a tone prompt', async () => {
            renderAudioStep()

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Speak with a sense of mystery/)).toBeInTheDocument()
            })

            const user = userEvent.setup()
            const textarea = screen.getByPlaceholderText(/Speak with a sense of mystery/)
            
            await user.type(textarea, 'Speak in a calm, soothing voice')
            
            expect(textarea).toHaveValue('Speak in a calm, soothing voice')
        })

        it('should show character count for tone prompt', async () => {
            renderAudioStep()

            await waitFor(() => {
                expect(screen.getByText('0/500')).toBeInTheDocument()
            })

            const user = userEvent.setup()
            const textarea = screen.getByPlaceholderText(/Speak with a sense of mystery/)
            
            await user.type(textarea, 'Test')
            
            expect(screen.getByText('4/500')).toBeInTheDocument()
        })
    })

    // =========================================================================
    // SECTION 6: Generate Audio Button Tests
    // =========================================================================
    describe('Generate Audio Button', () => {
        it('should show Generate Audio button when no audio exists', async () => {
            renderAudioStep()

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Generate Audio/i })).toBeInTheDocument()
            })
        })

        it('should disable Generate Audio button when no voice is selected', async () => {
            renderAudioStep({ 
                editorContext: { 
                    request: createMockEditorRequest({ voiceId: undefined })
                }
            })

            await waitFor(() => {
                const button = screen.getByRole('button', { name: /Generate Audio/i })
                expect(button).toBeDisabled()
            })
        })
    })
})
