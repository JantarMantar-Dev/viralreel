/**
 * Create Video Layout Integration Tests
 * 
 * These tests cover the integration of Step 2 validation with the
 * Continue button in the footer of the video creation wizard.
 * 
 * Key features tested:
 * - Continue button disabled states
 * - Tooltip display for missing fields
 * - Proper validation messages shown to users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import CreateVideoLayout from '../layout'

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
    initialRoute = '/create/script' 
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
 * Renders the layout within test routes
 */
function renderLayout(initialRoute = '/create/script?nicheId=test-niche') {
    return render(
        <TestWrapper initialRoute={initialRoute}>
            <Routes>
                <Route path="/create/*" element={<CreateVideoLayout />}>
                    <Route path="script" element={<div data-testid="script-step">Script Step Content</div>} />
                    <Route path="voice" element={<div data-testid="voice-step">Voice Step Content</div>} />
                </Route>
                <Route path="/videos" element={<div data-testid="videos-page">Videos Page</div>} />
            </Routes>
        </TestWrapper>
    )
}

describe('CreateVideoLayout - Continue Button Integration', () => {
    /**
     * ============================================
     * SECTION 1: Button Visibility Tests
     * ============================================
     * These tests verify when the Continue button appears.
     */
    describe('Button Visibility', () => {
        it('should show Continue button when nicheId is present', async () => {
            /**
             * Feature: Footer Visibility with Niche
             * The footer with Continue button appears when a niche is selected.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /continue to step 3/i })).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 2: Button Disabled State Tests
     * ============================================
     * These tests verify the Continue button is properly
     * disabled when required fields are missing.
     */
    describe('Button Disabled States', () => {
        it('should disable Continue button when required fields are missing', async () => {
            /**
             * Feature: Disabled Button for Invalid Form
             * The Continue button should be disabled when validation fails.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const button = screen.getByRole('button', { name: /continue to step 3/i })
                expect(button).toBeDisabled()
            })
        })
    })

    /**
     * ============================================
     * SECTION 3: Tooltip Display Tests
     * ============================================
     * These tests verify the tooltip structure is in place
     * for showing messages when hovering over the disabled button.
     */
    describe('Tooltip Structure', () => {
        it('should wrap Continue button in tooltip trigger for accessibility', async () => {
            /**
             * Feature: Tooltip Trigger Structure
             * Verifies the Continue button is wrapped in a tooltip
             * trigger element that will show missing fields on hover.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const button = screen.getByRole('button', { name: /continue to step 3/i })
                // The button should be wrapped in a span for tooltip triggering
                const tooltipWrapper = button.closest('span')
                expect(tooltipWrapper).toBeInTheDocument()
                expect(tooltipWrapper).toHaveAttribute('data-state')
            })
        })
    })

    /**
     * ============================================
     * SECTION 4: Step Indicator Tests
     * ============================================
     * These tests verify the step indicator shows correct info.
     */
    describe('Step Indicator', () => {
        it('should show correct step title for Step 2', async () => {
            /**
             * Feature: Step Title Display
             * The header should show "Script & Idea" for Step 2.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                expect(screen.getByText('Script & Idea')).toBeInTheDocument()
            })
        })

        it('should show step 2 indicator as active', async () => {
            /**
             * Feature: Active Step Indicator
             * The step 2 indicator should be highlighted.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                // The step indicator should show we're on step 2
                // Look for the step number or the compact "Step X of Y" indicator
                const stepIndicator = screen.getByText(/step 2/i)
                expect(stepIndicator).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 5: Navigation Tests
     * ============================================
     * These tests verify navigation behavior.
     */
    describe('Navigation', () => {
        it('should show Back button on Step 2', async () => {
            /**
             * Feature: Back Button Presence
             * Step 2 should have a Back button to return to Step 1.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
            })
        })

        it('should show exit button in header', async () => {
            /**
             * Feature: Exit Button Presence
             * Users should be able to exit the wizard at any time.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                // Look for buttons with the X icon (exit button has lucide-x class)
                const allButtons = screen.getAllByRole('button')
                // Find the exit button by looking for one that contains the X icon
                const exitButton = allButtons.find(button => 
                    button.querySelector('svg.lucide-x') !== null
                )
                expect(exitButton).toBeInTheDocument()
            })
        })
    })

    /**
     * ============================================
     * SECTION 6: Series vs Video Mode Tests
     * ============================================
     * These tests verify behavior differs based on job type.
     */
    describe('Job Type Modes', () => {
        it('should default to series mode', async () => {
            /**
             * Feature: Default Job Type
             * The wizard should default to series creation mode.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                // The breadcrumb should show "Create Series"
                expect(screen.getByText('Create Series')).toBeInTheDocument()
            })
        })

        it('should show "Create Video" when type=video in URL', async () => {
            /**
             * Feature: Video Mode from URL
             * When type=video is in the URL, should show video mode.
             */
            renderLayout('/create/script?nicheId=test-niche&type=video')
            
            await waitFor(() => {
                expect(screen.getByText('Create Video')).toBeInTheDocument()
            })
        })

        it('should show "Add Episode" when seriesId is present', async () => {
            /**
             * Feature: Add Episode Mode
             * When adding to existing series, should show "Add Episode".
             */
            renderLayout('/create/script?seriesId=existing-series-123')
            
            await waitFor(() => {
                expect(screen.getByText('Add Episode')).toBeInTheDocument()
            })
        })
    })
})

describe('CreateVideoLayout - Footer Interactions', () => {
    /**
     * ============================================
     * SECTION 1: Button Click Behavior
     * ============================================
     * These tests verify button click interactions.
     */
    describe('Button Click Behavior', () => {
        it('should have Continue button in disabled state when fields are empty', async () => {
            /**
             * Feature: Disabled Button State
             * When required fields are empty, the Continue button should be disabled.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const button = screen.getByRole('button', { name: /continue to step 3/i })
                expect(button).toBeDisabled()
            })
        })

        it('should prevent click action when button is disabled', async () => {
            /**
             * Feature: Disabled Button Click Prevention
             * A disabled button should not trigger any action when clicked.
             * This is ensured by the disabled attribute on the button.
             */
            renderLayout('/create/script?nicheId=test-niche')
            
            await waitFor(() => {
                const button = screen.getByRole('button', { name: /continue to step 3/i })
                // Verify button has pointer-events disabled via CSS class
                expect(button).toHaveClass('disabled:pointer-events-none')
            })
        })
    })
})
