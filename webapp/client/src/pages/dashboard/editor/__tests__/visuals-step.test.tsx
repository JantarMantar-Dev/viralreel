
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
            
            // Should show empty state text in gallery
            expect(screen.getByText('Generate images for all segments of your video')).toBeInTheDocument()
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

    describe('Generate Visual Prompts Logic', () => {
        it('should open confirmation dialog when clicking Generate Visual Prompts', async () => {
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()
            const regenButton = screen.getByRole('button', { name: /Generate Visual Prompts/i })
            
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
            await user.click(screen.getByRole('button', { name: /Generate Visual Prompts/i }))
            
            // Click confirm in dialog
            const confirmButton = screen.getByRole('button', { name: /^Generate Visual Prompts$/i }) // Regex to match exact button text inside dialog
            await user.click(confirmButton)

            expect(mockAnalyzeVisuals).toHaveBeenCalledWith({
                videoId: 'video-123',
                segments: MOCK_SEGMENTS
            })
        })
    })

    describe('Image Generation', () => {
        it('should call generateAllImages when clicking Generate All Images (no existing images)', async () => {
            // Use segments WITHOUT images to skip confirmation dialog
            const segmentsWithoutImages: VisualSegment[] = [
                {
                    id: 'seg-1',
                    index: 0,
                    timeRange: [0, 5],
                    subtitleText: 'Welcome to the video',
                    imagePrompt: 'A welcoming scene',
                    isGenerating: false
                    // No imageUrl
                }
            ]
            
            mockGenerateAllImages.mockResolvedValue({ segments: segmentsWithoutImages })
            
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: segmentsWithoutImages })
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

        it('should show confirmation dialog when segments have existing images', async () => {
            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS }) // Segment 2 has imageUrl
                }
            })

            const user = userEvent.setup()
            const generateButton = screen.getByRole('button', { name: /Generate All Images/i })
            
            await user.click(generateButton)

            // Should show confirmation dialog
            expect(screen.getByText('Regenerate All Images?')).toBeInTheDocument()
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

            // Check if dialog opened - the preview shows segment number as alt text
            // The dialog shows "Segment #2" text in the footer
            await waitFor(() => {
                expect(screen.getByText('Segment #2')).toBeInTheDocument()
            })
        })
    })

    describe('Segment Preload Workflow', () => {
        it('should display segments from previous run when preloaded in context', async () => {
            // Simulate a page load where segments already exist from a previous run
            const preloadedSegments: VisualSegment[] = [
                {
                    id: 'preload-seg-1',
                    index: 0,
                    timeRange: [0, 3],
                    subtitleText: 'Preloaded segment one',
                    imagePrompt: 'A preloaded scene description',
                    imageUrl: 'https://example.com/preloaded1.png',
                    isGenerating: false
                },
                {
                    id: 'preload-seg-2',
                    index: 1,
                    timeRange: [3, 6],
                    subtitleText: 'Preloaded segment two',
                    imagePrompt: 'Another preloaded scene',
                    imageUrl: 'https://example.com/preloaded2.png',
                    isGenerating: false
                }
            ]

            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: preloadedSegments })
                }
            })

            // Segments should be visible immediately
            await waitFor(() => {
                expect(screen.getByText('Segment 1')).toBeInTheDocument()
                expect(screen.getByText('Segment 2')).toBeInTheDocument()
            })

            // Should show gallery with correct segment count
            expect(screen.getByText('2 segments generated')).toBeInTheDocument()

            // Should show "Generate All Images" button (not the initial "Generate Visual Prompts")
            expect(screen.getByRole('button', { name: /Generate All Images/i })).toBeInTheDocument()
        })

        it('should show hasSegments as true when segments are preloaded', async () => {
            const preloadedSegments: VisualSegment[] = [
                {
                    id: 'seg-1',
                    index: 0,
                    timeRange: [0, 5],
                    subtitleText: 'Test segment',
                    imagePrompt: 'Test prompt',
                    isGenerating: false
                }
            ]

            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: preloadedSegments })
                }
            })

            // The segment cards section should be visible (only renders when hasSegments is true)
            await waitFor(() => {
                expect(screen.getByText('Segment 1')).toBeInTheDocument()
            })

            // Should show the segment count in gallery header
            expect(screen.getByText('1 segments generated')).toBeInTheDocument()
        })
    })

    describe('Prompt Validation', () => {
        it('should not call generateSegmentImage when prompt is empty', async () => {
            const segmentWithEmptyPrompt: VisualSegment[] = [
                {
                    id: 'seg-empty',
                    index: 0,
                    timeRange: [0, 5],
                    subtitleText: 'Segment with no prompt',
                    imagePrompt: '', // Empty prompt
                    isGenerating: false
                }
            ]

            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: segmentWithEmptyPrompt })
                }
            })

            const user = userEvent.setup()

            // Expand segment
            await user.click(screen.getByText('Segment 1'))

            // Click regenerate button
            const regenerateButton = screen.getByRole('button', { name: /Generate Image/i })
            await user.click(regenerateButton)

            // Should NOT call the mutation because prompt is empty
            expect(mockGenerateSegmentImage).not.toHaveBeenCalled()
        })

        it('should not call generateSegmentImage when prompt is only whitespace', async () => {
            const segmentWithWhitespacePrompt: VisualSegment[] = [
                {
                    id: 'seg-whitespace',
                    index: 0,
                    timeRange: [0, 5],
                    subtitleText: 'Segment with whitespace prompt',
                    imagePrompt: '   ', // Whitespace only
                    isGenerating: false
                }
            ]

            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: segmentWithWhitespacePrompt })
                }
            })

            const user = userEvent.setup()

            // Expand segment
            await user.click(screen.getByText('Segment 1'))

            // Click regenerate button
            const regenerateButton = screen.getByRole('button', { name: /Generate Image/i })
            await user.click(regenerateButton)

            // Should NOT call the mutation because prompt is only whitespace
            expect(mockGenerateSegmentImage).not.toHaveBeenCalled()
        })

        it('should call generateSegmentImage with valid prompt', async () => {
            mockGenerateSegmentImage.mockResolvedValue({ 
                segment: { ...MOCK_SEGMENTS[0], imageUrl: 'https://example.com/new.png' } 
            })

            renderVisualsStep({
                editorContext: {
                    request: createMockEditorRequest({ segments: MOCK_SEGMENTS })
                }
            })

            const user = userEvent.setup()

            // Expand first segment (which has a valid prompt)
            await user.click(screen.getByText('Segment 1'))

            // Click regenerate button
            const regenerateButton = screen.getByRole('button', { name: /Generate Image/i })
            await user.click(regenerateButton)

            // Should call the mutation with the prompt
            expect(mockGenerateSegmentImage).toHaveBeenCalledWith({
                videoId: 'video-123',
                segmentId: 'seg-1',
                prompt: 'A welcoming scene',
                style: 'comic'
            })
        })
    })

    describe('Segment Regeneration Workflow', () => {
        it('should update segment image url after regeneration', async () => {
             const segment: VisualSegment = {
                ...MOCK_SEGMENTS[0],
                imageUrl: 'https://example.com/old.png'
             };

             const newImageUrl = 'https://example.com/new-regenerated.png';
             mockGenerateSegmentImage.mockResolvedValue({ 
                 segment: { ...segment, imageUrl: newImageUrl } 
             });

             const updateRequestMock = vi.fn();

             renderVisualsStep({
                 editorContext: {
                     request: createMockEditorRequest({ segments: [segment] }),
                     updateRequest: updateRequestMock
                 }
             });

             const user = userEvent.setup();

             // Expand segment
             await user.click(screen.getByText('Segment 1'));

             // Click regenerate button
             const regenerateButton = screen.getByRole('button', { name: /Regenerate This Image/i });
             await user.click(regenerateButton);

             await waitFor(() => {
                 expect(updateRequestMock).toHaveBeenCalledWith(expect.objectContaining({
                     segments: expect.arrayContaining([
                         expect.objectContaining({
                             id: segment.id,
                             imageUrl: newImageUrl
                         })
                     ])
                 }));
             });
        });
    });
})
