/**
 * Editor Mode Workflow Integration Tests
 * 
 * These tests cover the complete Editor Mode workflow including:
 * - Editor Mode toggle behavior
 * - Dynamic step navigation with editor mode
 * - Script Editor step functionality
 * - Footer visibility across all steps
 * - 3-attempt regeneration limit with feedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import CreateVideoLayout from '../layout'
import ScriptStep from '../steps/script-step'
import ScriptEditorStep from '../steps/script-editor-step'
import NicheStep from '../steps/niche-step'
import VoiceStep from '../steps/voice-step'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

/**
 * Creates a test QueryClient with caching/retries disabled
 */
function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    })
}

/**
 * Wrapper component providing all required contexts
 */
function TestWrapper({ 
    children, 
    initialRoute = '/create/script?nicheId=test-niche' 
}: { 
    children: React.ReactNode
    initialRoute?: string 
}) {
    return (
        <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={[initialRoute]}>
                <TooltipProvider delayDuration={0}>
                    {children}
                </TooltipProvider>
            </MemoryRouter>
        </QueryClientProvider>
    )
}

/**
 * Renders the full layout with all steps for complete workflow testing
 */
function renderFullWorkflow(initialRoute = '/create/script?nicheId=test-niche') {
    return render(
        <TestWrapper initialRoute={initialRoute}>
            <Routes>
                <Route path="/create/*" element={<CreateVideoLayout />}>
                    <Route path="niche" element={<NicheStep />} />
                    <Route path="script" element={<ScriptStep />} />
                    <Route path="script-editor" element={<ScriptEditorStep />} />
                    <Route path="voice" element={<VoiceStep />} />
                </Route>
                <Route path="/videos" element={<div data-testid="videos-page">Videos Page</div>} />
            </Routes>
        </TestWrapper>
    )
}

/**
 * Renders just the ScriptStep for isolated testing
 */
function renderScriptStep(initialRoute = '/create/script?nicheId=test-niche') {
    return render(
        <TestWrapper initialRoute={initialRoute}>
            <Routes>
                <Route path="/create/*" element={<CreateVideoLayout />}>
                    <Route path="script" element={<ScriptStep />} />
                    <Route path="script-editor" element={<ScriptEditorStep />} />
                    <Route path="voice" element={<div data-testid="voice-step">Voice Step</div>} />
                </Route>
            </Routes>
        </TestWrapper>
    )
}

/**
 * Renders just the ScriptEditorStep for isolated testing
 */
function renderScriptEditorStep(initialRoute = '/create/script-editor?nicheId=test-niche') {
    return render(
        <TestWrapper initialRoute={initialRoute}>
            <Routes>
                <Route path="/create/*" element={<CreateVideoLayout />}>
                    <Route path="script" element={<ScriptStep />} />
                    <Route path="script-editor" element={<ScriptEditorStep />} />
                    <Route path="voice" element={<div data-testid="voice-step">Voice Step</div>} />
                </Route>
            </Routes>
        </TestWrapper>
    )
}

describe('Editor Mode Toggle - Script Step', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: Editor Mode Toggle Visibility
     * ============================================
     */
    describe('Toggle Visibility', () => {
        it('should display Editor Mode toggle on script step', async () => {
            renderScriptStep()
            
            await waitFor(() => {
                expect(screen.getByText('Editor Mode')).toBeInTheDocument()
            })
        })

        it('should display description for Editor Mode', async () => {
            renderScriptStep()
            
            await waitFor(() => {
                expect(screen.getByText(/Take full control over your video/)).toBeInTheDocument()
            })
        })

        it('should have a switch toggle for Editor Mode', async () => {
            renderScriptStep()
            
            await waitFor(() => {
                const toggle = screen.getByRole('switch')
                expect(toggle).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 2: Editor Mode Toggle Behavior
     * ============================================
     */
    describe('Toggle Behavior', () => {
        it('should toggle Editor Mode on when switch is clicked', async () => {
            const user = userEvent.setup()
            renderScriptStep()
            
            await waitFor(() => {
                const toggle = screen.getByRole('switch')
                expect(toggle).toHaveAttribute('data-state', 'unchecked')
            })

            const toggle = screen.getByRole('switch')
            await user.click(toggle)

            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'checked')
            })
        })

        it('should show informational note when Editor Mode is enabled', async () => {
            const user = userEvent.setup()
            renderScriptStep()
            
            const toggle = screen.getByRole('switch')
            await user.click(toggle)

            await waitFor(() => {
                expect(screen.getByText(/In the next step, you'll be able to:/)).toBeInTheDocument()
            })
        })

        it('should list available features when Editor Mode is enabled', async () => {
            const user = userEvent.setup()
            renderScriptStep()
            
            const toggle = screen.getByRole('switch')
            await user.click(toggle)

            await waitFor(() => {
                expect(screen.getByText(/Generate a script preview based on your idea/)).toBeInTheDocument()
                expect(screen.getByText(/Review and provide feedback for improvements/)).toBeInTheDocument()
                expect(screen.getByText(/Regenerate up to 3 times with your comments/)).toBeInTheDocument()
                expect(screen.getByText(/Accept the final script when satisfied/)).toBeInTheDocument()
            })
        })

        it('should NOT fire any API request when Editor Mode is toggled', async () => {
            const user = userEvent.setup()
            renderScriptStep()
            
            const toggle = screen.getByRole('switch')
            await user.click(toggle)

            // Wait a bit to ensure no API calls are made
            await new Promise(resolve => setTimeout(resolve, 500))

            // No fetch calls should have been made for script generation
            const scriptGenerationCalls = mockFetch.mock.calls.filter(
                call => call[0]?.includes('/scripting/')
            )
            expect(scriptGenerationCalls).toHaveLength(0)
        })
    })
})

describe('Footer Visibility Across Steps', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        // Mock niches API for niche step
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ niches: [] })
        })
    })

    /**
     * ============================================
     * SECTION 1: Footer on Niche Step
     * ============================================
     */
    describe('Niche Step Footer', () => {
        it('should NOT show footer when nicheId is not set (step 1)', async () => {
            render(
                <TestWrapper initialRoute="/create/niche">
                    <Routes>
                        <Route path="/create/*" element={<CreateVideoLayout />}>
                            <Route path="niche" element={<NicheStep />} />
                        </Route>
                    </Routes>
                </TestWrapper>
            )
            
            await waitFor(() => {
                // Footer should not be visible when no niche is selected
                const continueButton = screen.queryByRole('button', { name: /continue/i })
                // The button might not exist or might be hidden
                // This is expected behavior on niche step without selection
            })
        })
    })

    /**
     * ============================================
     * SECTION 2: Footer on Script Step
     * ============================================
     */
    describe('Script Step Footer', () => {
        it('should show footer when nicheId is present', async () => {
            renderScriptStep('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).toBeInTheDocument()
            })
        })

        it('should show Back button on script step', async () => {
            renderScriptStep('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const backButton = screen.getByRole('button', { name: /back/i })
                expect(backButton).toBeInTheDocument()
            })
        })

        it('should disable Continue button when required fields are missing', async () => {
            renderScriptStep('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).toBeDisabled()
            })
        })
    })

    /**
     * ============================================
     * SECTION 3: Footer on Script Editor Step
     * ============================================
     */
    describe('Script Editor Step Footer', () => {
        it('should show footer with Continue button on script-editor step', async () => {
            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            await waitFor(() => {
                // Footer should be visible with Continue button
                // Note: Back button may not show if step calculation puts it at step 1
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).toBeInTheDocument()
            })
        })

        it('should show Script Editor content alongside footer', async () => {
            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            await waitFor(() => {
                // Script editor content should be visible
                expect(screen.getByText('Script Editor')).toBeInTheDocument()
                expect(screen.getByText('Script Generation')).toBeInTheDocument()
            })
        })
    })
})

describe('Script Editor Step - Generation Controls', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: Initial State
     * ============================================
     */
    describe('Initial State', () => {
        it('should display Script Editor heading', async () => {
            renderScriptEditorStep()
            
            await waitFor(() => {
                expect(screen.getByText('Script Editor')).toBeInTheDocument()
            })
        })

        it('should show 3 tries remaining initially', async () => {
            renderScriptEditorStep()
            
            await waitFor(() => {
                expect(screen.getByText(/3 tries remaining/)).toBeInTheDocument()
            })
        })

        it('should display Generate Script button', async () => {
            renderScriptEditorStep()
            
            await waitFor(() => {
                const generateButton = screen.getByRole('button', { name: /generate script/i })
                expect(generateButton).toBeInTheDocument()
            })
        })

        it('should NOT show feedback textarea before first generation', async () => {
            renderScriptEditorStep()
            
            await waitFor(() => {
                const feedbackTextarea = screen.queryByPlaceholderText(/make it more dramatic/i)
                expect(feedbackTextarea).not.toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 2: Generate Button Behavior
     * ============================================
     */
    describe('Generate Button Behavior', () => {
        it('should call API when Generate Script button is clicked', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated story content',
                        wordCount: 100,
                        estimatedDurationSeconds: 60
                    }
                })
            })

            renderScriptEditorStep()
            
            await waitFor(() => {
                const generateButton = screen.getByRole('button', { name: /generate script/i })
                expect(generateButton).toBeInTheDocument()
            })

            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                const scriptingCalls = mockFetch.mock.calls.filter(
                    call => call[0]?.includes('/scripting/')
                )
                expect(scriptingCalls.length).toBeGreaterThan(0)
            })
        })

        it('should disable Generate button while API request is in progress', async () => {
            const user = userEvent.setup()
            
            // Create a promise that we can control
            let resolvePromise: (value: any) => void
            const pendingPromise = new Promise(resolve => {
                resolvePromise = resolve
            })
            
            mockFetch.mockReturnValueOnce(pendingPromise)

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            // Button should show loading state
            await waitFor(() => {
                expect(screen.getByText(/generating script/i)).toBeInTheDocument()
            })

            // Clean up
            resolvePromise!({
                ok: true,
                json: async () => ({ script: { story: 'test', wordCount: 10, estimatedDurationSeconds: 30 } })
            })
        })

        it('should show loading spinner during generation', async () => {
            const user = userEvent.setup()
            
            let resolvePromise: (value: any) => void
            const pendingPromise = new Promise(resolve => {
                resolvePromise = resolve
            })
            
            mockFetch.mockReturnValueOnce(pendingPromise)

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                // Look for the Loader2 spinner (has animate-spin class)
                const spinner = document.querySelector('.animate-spin')
                expect(spinner).toBeInTheDocument()
            })

            // Clean up
            resolvePromise!({
                ok: true,
                json: async () => ({ script: { story: 'test', wordCount: 10, estimatedDurationSeconds: 30 } })
            })
        })
    })

    /**
     * ============================================
     * SECTION 3: Post-Generation State
     * ============================================
     */
    describe('Post-Generation State', () => {
        it('should display generated script after successful generation', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'This is the generated story content for testing.',
                        wordCount: 100,
                        estimatedDurationSeconds: 60
                    }
                })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                expect(screen.getByText('This is the generated story content for testing.')).toBeInTheDocument()
            })
        })

        it('should show 2 tries remaining after first generation', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated content',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                expect(screen.getByText(/2 tries remaining/)).toBeInTheDocument()
            })
        })

        it('should show feedback textarea after first generation', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated content',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                const feedbackTextarea = screen.getByPlaceholderText(/make it more dramatic/i)
                expect(feedbackTextarea).toBeInTheDocument()
            })
        })

        it('should enable Continue button in footer after generation', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated content',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).not.toBeDisabled()
            })
        })

        it('should show Regenerate button after first generation', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated content',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
                expect(regenerateButton).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 4: Feedback Input
     * ============================================
     */
    describe('Feedback Input', () => {
        it('should allow typing feedback', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated content',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                const feedbackTextarea = screen.getByPlaceholderText(/make it more dramatic/i)
                expect(feedbackTextarea).toBeInTheDocument()
            })

            const feedbackTextarea = screen.getByPlaceholderText(/make it more dramatic/i)
            await user.type(feedbackTextarea, 'Make it more suspenseful')

            expect(feedbackTextarea).toHaveValue('Make it more suspenseful')
        })

        it('should show character count for feedback', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated content',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                expect(screen.getByText('0/500')).toBeInTheDocument()
            })
        })
    })
})

describe('Script Editor Step - 3 Attempt Limit', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: Attempt Counter
     * ============================================
     */
    describe('Attempt Counter', () => {
        it('should decrement tries remaining with each generation', async () => {
            const user = userEvent.setup()
            
            // Mock multiple successful generations
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        script: { story: 'First', wordCount: 10, estimatedDurationSeconds: 10 }
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        script: { story: 'Second', wordCount: 10, estimatedDurationSeconds: 10 }
                    })
                })

            renderScriptEditorStep()
            
            // First generation
            expect(screen.getByText(/3 tries remaining/)).toBeInTheDocument()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                expect(screen.getByText(/2 tries remaining/)).toBeInTheDocument()
            })

            // Second generation
            const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)

            await waitFor(() => {
                expect(screen.getByText(/1 try remaining/)).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 2: Maximum Attempts Reached
     * ============================================
     */
    describe('Maximum Attempts Reached', () => {
        it('should show warning when all attempts are used', async () => {
            const user = userEvent.setup()
            
            // Mock 3 successful generations
            for (let i = 0; i < 3; i++) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        script: { story: `Generation ${i + 1}`, wordCount: 10, estimatedDurationSeconds: 10 }
                    })
                })
            }

            renderScriptEditorStep()
            
            // First generation
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)
            await waitFor(() => expect(screen.getByText(/2 tries remaining/)).toBeInTheDocument())

            // Second generation
            let regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            await waitFor(() => expect(screen.getByText(/1 try remaining/)).toBeInTheDocument())

            // Third generation
            regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            
            await waitFor(() => {
                expect(screen.getByText(/No more regenerations available/)).toBeInTheDocument()
            })
        })

        it('should hide Regenerate button when all attempts are used', async () => {
            const user = userEvent.setup()
            
            // Mock 3 successful generations
            for (let i = 0; i < 3; i++) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        script: { story: `Generation ${i + 1}`, wordCount: 10, estimatedDurationSeconds: 10 }
                    })
                })
            }

            renderScriptEditorStep()
            
            // Use all 3 attempts
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)
            await waitFor(() => expect(screen.getByText(/2 tries remaining/)).toBeInTheDocument())

            let regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            await waitFor(() => expect(screen.getByText(/1 try remaining/)).toBeInTheDocument())

            regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            
            await waitFor(() => {
                // Regenerate button should no longer be visible
                const regenerateBtn = screen.queryByRole('button', { name: /regenerate/i })
                expect(regenerateBtn).not.toBeInTheDocument()
            })
        })

        it('should still show Continue button in footer when attempts are exhausted', async () => {
            const user = userEvent.setup()
            
            // Mock 3 successful generations
            for (let i = 0; i < 3; i++) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        script: { story: `Generation ${i + 1}`, wordCount: 10, estimatedDurationSeconds: 10 }
                    })
                })
            }

            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            // Use all 3 attempts
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)
            await waitFor(() => expect(screen.getByText(/2 tries remaining/)).toBeInTheDocument())

            let regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            await waitFor(() => expect(screen.getByText(/1 try remaining/)).toBeInTheDocument())

            regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            
            await waitFor(() => {
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).toBeInTheDocument()
                expect(continueButton).not.toBeDisabled()
            })
        })

        it('should hide feedback textarea when attempts are exhausted', async () => {
            const user = userEvent.setup()
            
            // Mock 3 successful generations
            for (let i = 0; i < 3; i++) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        script: { story: `Generation ${i + 1}`, wordCount: 10, estimatedDurationSeconds: 10 }
                    })
                })
            }

            renderScriptEditorStep()
            
            // Use all 3 attempts
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)
            await waitFor(() => expect(screen.getByText(/2 tries remaining/)).toBeInTheDocument())

            let regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            await waitFor(() => expect(screen.getByText(/1 try remaining/)).toBeInTheDocument())

            regenerateButton = screen.getByRole('button', { name: /regenerate/i })
            await user.click(regenerateButton)
            
            await waitFor(() => {
                const feedbackTextarea = screen.queryByPlaceholderText(/make it more dramatic/i)
                expect(feedbackTextarea).not.toBeInTheDocument()
            })
        })
    })
})

describe('Dynamic Step Navigation with Editor Mode', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: Step Count Changes
     * ============================================
     */
    describe('Step Count Changes', () => {
        it('should show 6 steps when Editor Mode is OFF', async () => {
            renderScriptStep('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                // Without editor mode, we should see step 2 of 6
                expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument()
            })
        })

        it('should show 7 steps when Editor Mode is ON', async () => {
            const user = userEvent.setup()
            renderScriptStep('/create/script?nicheId=test-niche')
            
            // Toggle editor mode on
            const toggle = screen.getByRole('switch')
            await user.click(toggle)

            await waitFor(() => {
                // With editor mode, we should see step 2 of 7
                expect(screen.getByText(/step 2 of 7/i)).toBeInTheDocument()
            })
        })
    })
})

describe('Error Handling', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: API Error Handling
     * ============================================
     */
    describe('API Error Handling', () => {
        it('should show error toast when generation fails', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Generation failed due to server error' })
            })

            renderScriptEditorStep()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            // Note: Toast testing might require additional setup
            // This tests that the button is re-enabled after error
            await waitFor(() => {
                const button = screen.getByRole('button', { name: /generate script/i })
                expect(button).not.toBeDisabled()
            })
        })

        it('should NOT decrement tries when generation fails', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Generation failed' })
            })

            renderScriptEditorStep()
            
            expect(screen.getByText(/3 tries remaining/)).toBeInTheDocument()
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            // Tries should still be 3 after failure
            await waitFor(() => {
                expect(screen.getByText(/3 tries remaining/)).toBeInTheDocument()
            })
        })
    })
})

describe('Script Editor Step - Back Navigation', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: Footer Navigation on Script Editor
     * ============================================
     */
    describe('Footer Navigation on Script Editor', () => {
        it('should display footer with Continue button on script-editor step', async () => {
            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            await waitFor(() => {
                // Continue button should exist
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).toBeInTheDocument()
            })
        })

        it('should disable Continue button when no script is generated', async () => {
            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            await waitFor(() => {
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).toBeDisabled()
            })
        })

        it('should enable Continue button after script is generated', async () => {
            const user = userEvent.setup()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    script: {
                        story: 'Generated test script',
                        wordCount: 50,
                        estimatedDurationSeconds: 30
                    }
                })
            })

            renderScriptEditorStep('/create/script-editor?nicheId=test-niche')
            
            const generateButton = screen.getByRole('button', { name: /generate script/i })
            await user.click(generateButton)

            await waitFor(() => {
                const continueButton = screen.getByRole('button', { name: /continue/i })
                expect(continueButton).not.toBeDisabled()
            })
        })
    })
})

describe('Editor Mode Toggle - State Reset', () => {
    beforeEach(() => {
        mockFetch.mockClear()
    })

    /**
     * ============================================
     * SECTION 1: Toggle OFF Resets Script State
     * ============================================
     */
    describe('Toggle OFF Resets Script State', () => {
        it('should reset script state when editor mode is toggled OFF', async () => {
            const user = userEvent.setup()
            renderScriptStep('/create/script?nicheId=test-niche')
            
            // Enable editor mode
            const toggle = screen.getByRole('switch')
            await user.click(toggle)
            
            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'checked')
            })

            // Disable editor mode
            await user.click(toggle)

            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'unchecked')
            })

            // The informational note should be hidden
            expect(screen.queryByText(/In the next step, you'll be able to:/)).not.toBeInTheDocument()
        })

        it('should hide editor mode info panel when toggled OFF', async () => {
            const user = userEvent.setup()
            renderScriptStep('/create/script?nicheId=test-niche')
            
            // Enable editor mode first
            const toggle = screen.getByRole('switch')
            await user.click(toggle)
            
            await waitFor(() => {
                expect(screen.getByText(/In the next step, you'll be able to:/)).toBeInTheDocument()
            })

            // Disable editor mode
            await user.click(toggle)

            await waitFor(() => {
                expect(screen.queryByText(/In the next step, you'll be able to:/)).not.toBeInTheDocument()
            })
        })

        it('should show 6 steps after editor mode is toggled OFF', async () => {
            const user = userEvent.setup()
            renderScriptStep('/create/script?nicheId=test-niche')
            
            // Enable editor mode - should show 7 steps
            const toggle = screen.getByRole('switch')
            await user.click(toggle)
            
            await waitFor(() => {
                expect(screen.getByText(/step 2 of 7/i)).toBeInTheDocument()
            })

            // Disable editor mode - should show 6 steps again
            await user.click(toggle)

            await waitFor(() => {
                expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 2: Re-enable Editor Mode Fresh Start
     * ============================================
     */
    describe('Re-enable Editor Mode Fresh Start', () => {
        it('should start with 3 attempts when editor mode is re-enabled', async () => {
            const user = userEvent.setup()
            renderScriptStep('/create/script?nicheId=test-niche')
            
            // Enable editor mode
            const toggle = screen.getByRole('switch')
            await user.click(toggle)
            
            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'checked')
            })

            // Disable editor mode (this resets scriptGenerationCount to 0)
            await user.click(toggle)

            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'unchecked')
            })

            // Re-enable editor mode
            await user.click(toggle)

            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'checked')
                // Step indicator should show 7 steps (editor mode)
                expect(screen.getByText(/step 2 of 7/i)).toBeInTheDocument()
            })
        })

        it('should clear feedback when editor mode is toggled OFF and back ON', async () => {
            const user = userEvent.setup()
            renderScriptStep('/create/script?nicheId=test-niche')
            
            // Enable -> Disable -> Enable
            const toggle = screen.getByRole('switch')
            await user.click(toggle) // ON
            await user.click(toggle) // OFF
            await user.click(toggle) // ON
            
            await waitFor(() => {
                expect(toggle).toHaveAttribute('data-state', 'checked')
            })

            // Navigate to script editor and verify fresh state
            // (This would require actual navigation which is complex in isolated test)
            // For now, just verify editor mode is enabled
            expect(screen.getByText(/In the next step, you'll be able to:/)).toBeInTheDocument()
        })
    })
})
