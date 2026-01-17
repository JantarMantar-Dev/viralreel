
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock the useEditorVideo hook
const mockUseEditorVideo = vi.fn()
vi.mock('@/hooks/useEditorApi', async () => {
    const actual = await vi.importActual('@/hooks/useEditorApi')
    return {
        ...actual,
        useEditorVideo: () => mockUseEditorVideo(),
        useUpdateVideoMetadata: () => ({ mutateAsync: vi.fn() }),
    }
})

// Import after mocking
import EditorModeLayout from '../layout'

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    })
}

function renderLayout(videoId: string = 'video-123') {
    const path = `/editor/visuals?videoId=${videoId}`
    
    return render(
        <QueryClientProvider client={createQueryClient()}>
            <MemoryRouter initialEntries={[path]}>
                <TooltipProvider>
                    <Routes>
                        <Route path="/editor/*" element={<EditorModeLayout />} />
                    </Routes>
                </TooltipProvider>
            </MemoryRouter>
        </QueryClientProvider>
    )
}

describe('Visuals Step Validation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should disable Continue button when segments lack images', async () => {
        const mockVideo = {
            id: 'video-123',
            segments: [
                { id: 'seg-1', imageUrl: null, generatedImageUrl: null },
                { id: 'seg-2', imageUrl: 'http://example.com/img.jpg', generatedImageUrl: null }
            ],
            // Add other required fields if necessary
            niche: { id: 'niche-1' },
            approvedScript: { story: 'story' },
        }

        mockUseEditorVideo.mockReturnValue({
            data: { video: mockVideo },
            isLoading: false,
            error: null,
            dataUpdatedAt: Date.now()
        })

        renderLayout()

        await waitFor(() => {
            const button = screen.getByText('Continue to Step 5').closest('button')
            expect(button).toBeDisabled()
        })
    })

    it('should enable Continue button when all segments have images', async () => {
        const mockVideo = {
            id: 'video-123',
            segments: [
                { id: 'seg-1', imageUrl: 'http://example.com/img1.jpg', generatedImageUrl: null },
                { id: 'seg-2', imageUrl: null, generatedImageUrl: 'http://example.com/img2.jpg' }
            ],
            niche: { id: 'niche-1' },
            approvedScript: { story: 'story' },
        }

        mockUseEditorVideo.mockReturnValue({
            data: { video: mockVideo },
            isLoading: false,
            error: null,
            dataUpdatedAt: Date.now()
        })

        renderLayout()

        await waitFor(() => {
            const button = screen.getByText('Continue to Step 5').closest('button')
            expect(button).not.toBeDisabled()
        })
    })
})
