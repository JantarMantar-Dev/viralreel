
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { 
    EditorCreationContext, 
    EditorCreationContextType, 
    EditorModeRequest,
    INITIAL_EDITOR_REQUEST,
    VisualSegment
} from '../context/editor-creation-context'
import EditorVisualsStep from '../steps/visuals-step'
import * as useEditorApi from '@/hooks/useEditorApi'

// =============================================================================
// MOCKS
// =============================================================================

const mockAnalyzeVisuals = vi.fn()
const mockGenerateSegmentImage = vi.fn()
const mockGenerateAllImages = vi.fn()
const mockUpdateSegmentPrompt = vi.fn()

// Mock the hooks
vi.mock('@/hooks/useEditorApi', async (importOriginal) => {
    const actual = await importOriginal() as any
    return {
        ...actual,
        useAnalyzeVisuals: () => ({
            mutateAsync: mockAnalyzeVisuals,
            isPending: false
        }),
        useGenerateSegmentImage: () => ({
            mutateAsync: mockGenerateSegmentImage,
            isPending: false
        }),
        useGenerateAllImages: () => ({
            mutateAsync: mockGenerateAllImages,
            isPending: false
        }),
        useUpdateSegmentPrompt: () => ({
            mutateAsync: mockUpdateSegmentPrompt,
            isPending: false
        })
    }
})

// =============================================================================
// TEST DATA
// =============================================================================

const MOCK_SEGMENTS: VisualSegment[] = [
    {
        id: 'seg-1',
        index: 0,
        timeRange: [0, 5],
        subtitleText: 'Welcome to the video',
        imagePrompt: 'A welcoming scene',
        isGenerating: false
    },
    {
        id: 'seg-2',
        index: 1,
        timeRange: [5, 10],
        subtitleText: 'This is the second part',
        imagePrompt: 'A second scene description',
        isGenerating: false,
        imageUrl: 'https://example.com/image2.png'
    }
]

function createMockEditorRequest(overrides: Partial<EditorModeRequest> = {}): EditorModeRequest {
    return {
        ...INITIAL_EDITOR_REQUEST,
        videoId: 'video-123',
        audioUrl: 'https://example.com/audio.mp3',
        audioDurationSeconds: 10,
        approvedScript: {
            story: 'Test script',
            wordCount: 10,
            estimatedDurationSeconds: 10,
        },
        segments: [],
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
        currentStep: 4,
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
}

function renderVisualsStep(options: RenderOptions = {}) {
    const { editorContext = {} } = options
    const mockContext = createMockEditorContext(editorContext)
    const queryClient = createTestQueryClient()

    const result = render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <TooltipProvider>
                    <EditorCreationContext.Provider value={mockContext}>
                        <EditorVisualsStep />
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

describe('EditorVisualsStep Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering and Initialization', () => {
        it('should render empty state correctly', async () => {
            renderVisualsStep()
            
            await waitFor(() => {
                expect(screen.getByText('Visual Generation')).toBeInTheDocument()
            })
            
            // Should show initial generate button
            expect(screen.getByRole('button', { name: /Generate Visual Prompts/i })).toBeInTheDocument()
        })

        it('should render segments when available', async () => {
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            await waitFor(() => {
                expect(screen.getByText('Segment 1')).toBeInTheDocument()
                expect(screen.getByText('Segment 2')).toBeInTheDocument()
            })
        })
    })

    describe('Regenerate Prompts Logic', () => {
        it('should open confirmation dialog when clicking Regenerate Prompts', async () => {
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()
            const regenButton = screen.getByRole('button', { name: /Regenerate Prompts/i })
            
            await user.click(regenButton)

            expect(screen.getByText('Regenerate Visual Prompts?')).toBeInTheDocument()
            expect(screen.getByText(/Are you sure you want to regenerate all visual prompts?/)).toBeInTheDocument()
        })

        it('should call analyzeVisuals when confirming regeneration', async () => {
            mockAnalyzeVisuals.mockResolvedValue({ segments: MOCK_SEGMENTS })
            
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()
            
            // Open dialog
            await user.click(screen.getByRole('button', { name: /Regenerate Prompts/i }))
            
            // Click confirm in dialog
            const confirmButton = screen.getByRole('button', { name: /^Regenerate Prompts$/i }) // Regex to match exact button text inside dialog
            await user.click(confirmButton)

            expect(mockAnalyzeVisuals).toHaveBeenCalledWith({
                videoId: 'video-123',
                script: 'Test script',
                audioDurationSeconds: 10
            })
        })
    })

    describe('Image Generation', () => {
        it('should call generateAllImages when clicking Generate All Images', async () => {
            mockGenerateAllImages.mockResolvedValue({ segments: MOCK_SEGMENTS })
            
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()
            const generateButton = screen.getByRole('button', { name: /Generate All Images/i })
            
            await user.click(generateButton)

            expect(mockGenerateAllImages).toHaveBeenCalledWith({
                videoId: 'video-123',
                style: 'comic' // Default style
            })
        })
    })

    describe('Manual Prompt Editing', () => {
        it('should save prompt edits on blur', async () => {
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()
            
            // Expand first segment
            await user.click(screen.getByText('Segment 1'))
            
            // Find textarea
            const textarea = screen.getByDisplayValue('A welcoming scene')
            
            // Edit text
            await user.clear(textarea)
            await user.type(textarea, 'A new scene description')
            
            // Blur (click outside)
            await user.click(document.body)

            expect(mockUpdateSegmentPrompt).toHaveBeenCalledWith({
                videoId: 'video-123',
                segmentId: 'seg-1',
                prompt: 'A new scene description'
            })
        })
    })

    describe('Image Expansion', () => {
        it('should open image preview dialog when clicking Expand View', async () => {
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()
            
            // Expand second segment (which has an image)
            await user.click(screen.getByText('Segment 2'))
            
            // Hover over image area to show button (simulated by finding button directly as css hover doesn't apply in jsdom)
            // In our implementation, the button is always in DOM but hidden with opacity. 
            // userEvent can click it if we ensure it's "visible" or just target it.
            // Since we can't easily simulate hover styles in jsdom, we'll look for the button.
            
            const expandButton = screen.getByRole('button', { name: /Expand View/i })
            await user.click(expandButton)

            // Check if dialog opened
            expect(screen.getByAltText('Full preview')).toBeInTheDocument()
            
            // The text appears in both the textarea and the dialog overlay
            const textElements = screen.getAllByText('A second scene description')
            expect(textElements.length).toBeGreaterThanOrEqual(2)
            
            // Verify one of them is the dialog overlay text
            const dialogText = textElements.find(el => el.tagName === 'P' && el.className.includes('text-white/90'))
            expect(dialogText).toBeInTheDocument()
        })
    })
})
