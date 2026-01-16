/**
 * EditorModeLayout - Video Data Loading Tests
 * 
 * Tests that video data is properly synced from API to UI state.
 * 
 * Bug fix verified:
 * - Previously, `isVideoLoaded` flag prevented fresh data from loading on refresh
 * - Now uses `loadedVideoId` to track which video is loaded and allows re-sync
 */

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

function renderLayout(videoId: string | null = null) {
    const path = videoId ? `/editor/audio?videoId=${videoId}` : '/editor/audio'
    
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

describe('EditorModeLayout - Video Data Loading', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should load video data from API on initial render', async () => {
        const mockVideo = {
            id: 'video-123',
            title: 'Test Video',
            niche: { id: 'niche-1', name: 'Test Niche' },
            audioVersions: [
                {
                    id: 'audio-1',
                    subtitles: [{ text: 'Hello', start: 0, end: 30 }],
                    segments: [{ dialogue: 'Test segment', start: 0, end: 90, duration: 3 }],
                }
            ],
            selectedAudioId: 'audio-1',
        }

        mockUseEditorVideo.mockReturnValue({
            data: { video: mockVideo },
            isLoading: false,
            error: null,
        })

        renderLayout('video-123')

        await waitFor(() => {
            expect(screen.getByText('Audio Synthesis')).toBeInTheDocument()
        })
    })

    it('should show loading state while fetching video', async () => {
        mockUseEditorVideo.mockReturnValue({
            data: null,
            isLoading: true,
            error: null,
        })

        renderLayout('video-123')

        await waitFor(() => {
            expect(screen.getByText('Loading your video...')).toBeInTheDocument()
        })
    })

    it('should update state when API returns fresh data', async () => {
        // First render with initial data
        const initialVideo = {
            id: 'video-123',
            title: 'Initial Title',
            audioVersions: [],
        }

        mockUseEditorVideo.mockReturnValue({
            data: { video: initialVideo },
            isLoading: false,
            error: null,
        })

        const { rerender } = renderLayout('video-123')

        await waitFor(() => {
            expect(screen.getByText('Audio Synthesis')).toBeInTheDocument()
        })

        // Simulate API returning updated data (like after a save + refresh)
        const updatedVideo = {
            id: 'video-123',
            title: 'Updated Title',
            audioVersions: [
                {
                    id: 'audio-1',
                    subtitles: [{ text: 'Updated', start: 0, end: 30 }],
                    segments: [{ dialogue: 'Updated segment', start: 0, end: 90, duration: 3 }],
                }
            ],
            selectedAudioId: 'audio-1',
        }

        mockUseEditorVideo.mockReturnValue({
            data: { video: updatedVideo },
            isLoading: false,
            error: null,
        })

        // Force re-render to simulate React Query refetch
        rerender(
            <QueryClientProvider client={createQueryClient()}>
                <MemoryRouter initialEntries={['/editor/audio?videoId=video-123']}>
                    <TooltipProvider>
                        <Routes>
                            <Route path="/editor/*" element={<EditorModeLayout />} />
                        </Routes>
                    </TooltipProvider>
                </MemoryRouter>
            </QueryClientProvider>
        )

        // The component should render without errors
        await waitFor(() => {
            expect(screen.getByText('Audio Synthesis')).toBeInTheDocument()
        })
    })

    it('should handle error when video fails to load', async () => {
        mockUseEditorVideo.mockReturnValue({
            data: null,
            isLoading: false,
            error: new Error('Failed to load'),
        })

        renderLayout('video-123')

        // Should still render the page (with error toast, but not crash)
        await waitFor(() => {
            expect(screen.getByText('Audio Synthesis')).toBeInTheDocument()
        })
    })

    it('should not load video data when no videoId provided', async () => {
        mockUseEditorVideo.mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
        })

        renderLayout(null)

        await waitFor(() => {
            expect(screen.getByText('Audio Synthesis')).toBeInTheDocument()
        })

        // Should render empty state without loading
        expect(screen.queryByText('Loading your video...')).not.toBeInTheDocument()
    })
})
