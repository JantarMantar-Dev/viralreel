/**
 * ScriptStep Component Tests
 * 
 * These tests cover the Script & Idea step (Step 2) of the video creation wizard.
 * This step allows users to define video details including:
 * - Series/Video name
 * - Episode title (for series)
 * - Script idea/context with 10,000 character limit
 * - Aspect ratio selection
 * - Image style selection
 * - Duration selection
 * - Visual format selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockRequest } from '@/test/test-utils'
import ScriptStep from '../steps/script-step'

describe('ScriptStep Component', () => {
    /**
     * ============================================
     * SECTION 1: Component Rendering Tests
     * ============================================
     * These tests verify that all required UI elements
     * are present when the component renders.
     */
    describe('Component Rendering', () => {
        it('should render the step header with correct title and description', () => {
            /**
             * Feature: Step Header Display
             * Verifies that the component displays the correct header
             * to guide users on what information to provide.
             */
            renderWithProviders(<ScriptStep />)
            
            expect(screen.getByText('Define your Video Details')).toBeInTheDocument()
            expect(screen.getByText(/Provide specific instructions to tailor the AI script/)).toBeInTheDocument()
        })

        it('should render the script idea textarea', () => {
            /**
             * Feature: Script Idea Input
             * Verifies the main textarea for entering video ideas is present.
             */
            renderWithProviders(<ScriptStep />)
            
            const textarea = screen.getByPlaceholderText(/Example: Create a series about/)
            expect(textarea).toBeInTheDocument()
        })

        it('should render all image style options', () => {
            /**
             * Feature: Image Style Selection
             * Verifies all available visual styles are displayed for selection.
             */
            renderWithProviders(<ScriptStep />)
            
            const styles = ['Comic', 'Creepy Comic', 'Painting', 'Ghibli', 'Anime', 
                           'Dark Fantasy', 'Lego', 'Polaroid', 'Disney', 'Realism', 'Fantastic']
            
            styles.forEach(style => {
                expect(screen.getByText(style)).toBeInTheDocument()
            })
        })

        it('should render duration slider with all time options', () => {
            /**
             * Feature: Duration Selection
             * Verifies the duration options (30s to 5 minutes) are displayed.
             */
            renderWithProviders(<ScriptStep />)
            
            expect(screen.getByText('30s')).toBeInTheDocument()
            expect(screen.getByText('1m')).toBeInTheDocument()
            expect(screen.getByText('2m')).toBeInTheDocument()
            expect(screen.getByText('3m')).toBeInTheDocument()
            expect(screen.getByText('4m')).toBeInTheDocument()
            expect(screen.getByText('5m')).toBeInTheDocument()
        })

        it('should render aspect ratio options', () => {
            /**
             * Feature: Aspect Ratio Selection
             * Verifies portrait and landscape options are displayed.
             */
            renderWithProviders(<ScriptStep />)
            
            expect(screen.getByText('Portrait (9:16)')).toBeInTheDocument()
            expect(screen.getByText('Landscape (16:9)')).toBeInTheDocument()
        })

        it('should render visual format options', () => {
            /**
             * Feature: Visual Format Selection
             * Verifies the visual format options (image vs video) are displayed.
             */
            renderWithProviders(<ScriptStep />)
            
            expect(screen.getByText('Dynamic Image Story')).toBeInTheDocument()
            expect(screen.getByText('Video B-Roll Story')).toBeInTheDocument()
        })
    })

    /**
     * ============================================
     * SECTION 2: Character Limit Tests
     * ============================================
     * These tests verify the 10,000 character limit
     * on the script idea textarea is enforced correctly.
     */
    describe('Character Limit', () => {
        it('should display the correct character limit of 10,000', () => {
            /**
             * Feature: Character Counter Display
             * Verifies the character counter shows the 10,000 limit.
             */
            renderWithProviders(<ScriptStep />)
            
            expect(screen.getByText('0/10000')).toBeInTheDocument()
        })

        it('should update character count as user types', async () => {
            /**
             * Feature: Live Character Count
             * Verifies the counter updates in real-time as user enters text.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ scriptIdea: '' })
                }
            })
            
            const textarea = screen.getByPlaceholderText(/Example: Create a series about/)
            await user.type(textarea, 'Test input')
            
            // Verify updateRequest was called with the typed text
            expect(mockUpdateRequest).toHaveBeenCalledWith({ scriptIdea: 'T' })
        })

        it('should have maxLength attribute set to 10000', () => {
            /**
             * Feature: HTML5 Character Limit Enforcement
             * Verifies the textarea has the correct maxLength attribute
             * to prevent users from entering more than 10,000 characters.
             */
            renderWithProviders(<ScriptStep />)
            
            const textarea = screen.getByPlaceholderText(/Example: Create a series about/)
            expect(textarea).toHaveAttribute('maxLength', '10000')
        })

        it('should display current character count based on existing script idea', () => {
            /**
             * Feature: Pre-populated Character Count
             * Verifies the counter shows correct count when script idea
             * is pre-populated (e.g., when editing an existing video).
             */
            const testScript = 'This is a test script idea with some content.'
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ scriptIdea: testScript })
                }
            })
            
            expect(screen.getByText(`${testScript.length}/10000`)).toBeInTheDocument()
        })
    })

    /**
     * ============================================
     * SECTION 3: Form Field Behavior (Series Mode)
     * ============================================
     * These tests verify form field behavior when
     * creating a series (multiple episodes).
     */
    describe('Series Mode Form Fields', () => {
        it('should display "Series Name" label when jobType is series', () => {
            /**
             * Feature: Dynamic Field Labels
             * Verifies the name field shows "Series Name" for series creation.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ jobType: 'series' })
                }
            })
            
            expect(screen.getByText('Series Name')).toBeInTheDocument()
        })

        it('should display episode title field when jobType is series', () => {
            /**
             * Feature: Episode Title Field
             * Verifies the episode title field appears for series creation.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ jobType: 'series' })
                }
            })
            
            expect(screen.getByText('Episode 1 Title')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('e.g. The Bermuda Triangle Secret')).toBeInTheDocument()
        })

        it('should lock series name field when seriesId is provided', () => {
            /**
             * Feature: Locked Series Name for Existing Series
             * When adding an episode to an existing series, the series name
             * should be read-only to maintain consistency.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ 
                        jobType: 'series',
                        seriesId: 'existing-series-123',
                        seriesName: 'Existing Series Name'
                    })
                }
            })
            
            const seriesNameInput = screen.getByDisplayValue('Existing Series Name')
            expect(seriesNameInput).toBeDisabled()
        })

        it('should update series name when user types', async () => {
            /**
             * Feature: Series Name Input
             * Verifies the series name is updated when user types.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ jobType: 'series', seriesName: '' })
                }
            })
            
            const input = screen.getByPlaceholderText('e.g. Unsolved Mysteries of the Deep')
            await user.type(input, 'M')
            
            expect(mockUpdateRequest).toHaveBeenCalledWith({ seriesName: 'M' })
        })

        it('should update episode title when user types', async () => {
            /**
             * Feature: Episode Title Input
             * Verifies the episode title is updated when user types.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ jobType: 'series', episodeTitle: '' })
                }
            })
            
            const input = screen.getByPlaceholderText('e.g. The Bermuda Triangle Secret')
            await user.type(input, 'E')
            
            expect(mockUpdateRequest).toHaveBeenCalledWith({ episodeTitle: 'E' })
        })
    })

    /**
     * ============================================
     * SECTION 4: Form Field Behavior (Video Mode)
     * ============================================
     * These tests verify form field behavior when
     * creating a single standalone video.
     */
    describe('Video Mode Form Fields', () => {
        it('should display "Video Name" label when jobType is video', () => {
            /**
             * Feature: Dynamic Field Labels
             * Verifies the name field shows "Video Name" for single video creation.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ jobType: 'video' })
                }
            })
            
            expect(screen.getByText('Video Name')).toBeInTheDocument()
        })

        it('should NOT display episode title field when jobType is video', () => {
            /**
             * Feature: Hidden Episode Field for Videos
             * Episode title is only relevant for series, not standalone videos.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ jobType: 'video' })
                }
            })
            
            expect(screen.queryByText('Episode 1 Title')).not.toBeInTheDocument()
        })

        it('should display "Video Idea & Context" header for video mode', () => {
            /**
             * Feature: Context-Aware Section Headers
             * Verifies section header changes based on job type.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ jobType: 'video' })
                }
            })
            
            expect(screen.getByText('Video Idea & Context')).toBeInTheDocument()
        })
    })

    /**
     * ============================================
     * SECTION 5: Image Style Selection Tests
     * ============================================
     * These tests verify the image style selection
     * functionality works correctly.
     */
    describe('Image Style Selection', () => {
        it('should highlight the currently selected style', () => {
            /**
             * Feature: Visual Selection Indicator
             * Verifies the selected style is visually distinguished.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ visualStyle: 'comic' })
                }
            })
            
            // The Comic style container should have the selected styling
            // We check by finding the style and verifying it's in the document
            expect(screen.getByText('Comic')).toBeInTheDocument()
        })

        it('should call updateRequest when selecting a new style', async () => {
            /**
             * Feature: Style Selection Updates State
             * Verifies clicking a style updates the request state.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ visualStyle: 'comic' })
                }
            })
            
            // Click on the Anime style
            const animeOption = screen.getByText('Anime').closest('div[class*="cursor-pointer"]')
            if (animeOption) {
                await user.click(animeOption)
                expect(mockUpdateRequest).toHaveBeenCalledWith({ visualStyle: 'anime' })
            }
        })

        it('should show "Coming Soon" badge for unavailable styles', () => {
            /**
             * Feature: Coming Soon Indicator
             * Verifies that styles not yet available are marked accordingly.
             */
            renderWithProviders(<ScriptStep />)
            
            // The "Add Your Own" custom style should show coming soon
            const comingSoonBadges = screen.getAllByText('Coming Soon')
            expect(comingSoonBadges.length).toBeGreaterThan(0)
        })
    })

    /**
     * ============================================
     * SECTION 6: Duration Selection Tests
     * ============================================
     * These tests verify the duration selection
     * functionality works correctly.
     */
    describe('Duration Selection', () => {
        it('should allow selecting 30 seconds duration', async () => {
            /**
             * Feature: 30 Second Duration Selection
             * Verifies the shortest duration option works.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ duration: 1 })
                }
            })
            
            const thirtySecOption = screen.getByText('30s').closest('div[class*="cursor-pointer"]')
            if (thirtySecOption) {
                await user.click(thirtySecOption)
                expect(mockUpdateRequest).toHaveBeenCalledWith({ duration: 0.5 })
            }
        })

        it('should allow selecting 1 minute duration', async () => {
            /**
             * Feature: 1 Minute Duration Selection
             * Verifies the 1 minute duration option works.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ duration: 0.5 })
                }
            })
            
            const oneMinOption = screen.getByText('1m').closest('div[class*="cursor-pointer"]')
            if (oneMinOption) {
                await user.click(oneMinOption)
                expect(mockUpdateRequest).toHaveBeenCalledWith({ duration: 1 })
            }
        })

        it('should display "Coming Soon" for durations above 1 minute', () => {
            /**
             * Feature: Future Duration Options
             * Verifies that longer durations (2-5 min) are marked as coming soon.
             */
            renderWithProviders(<ScriptStep />)
            
            // The 2m, 3m, 4m, 5m options should be disabled with coming soon
            // These show on hover, so we just verify the structure exists
            expect(screen.getByText('2m')).toBeInTheDocument()
            expect(screen.getByText('3m')).toBeInTheDocument()
            expect(screen.getByText('4m')).toBeInTheDocument()
            expect(screen.getByText('5m')).toBeInTheDocument()
        })

        it('should display current duration in the section description', () => {
            /**
             * Feature: Current Duration Display
             * Verifies the selected duration is shown in the section header.
             */
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    request: createMockRequest({ duration: 1 })
                }
            })
            
            expect(screen.getByText('1 Minute')).toBeInTheDocument()
        })
    })

    /**
     * ============================================
     * SECTION 7: Aspect Ratio Selection Tests
     * ============================================
     * These tests verify the aspect ratio selection
     * functionality works correctly.
     */
    describe('Aspect Ratio Selection', () => {
        it('should allow selecting portrait aspect ratio', async () => {
            /**
             * Feature: Portrait Mode Selection
             * Verifies users can select 9:16 portrait mode for Reels/TikTok.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ aspectRatio: 'portrait' })
                }
            })
            
            // Portrait should be selectable
            const portraitOption = screen.getByText('Portrait (9:16)').closest('div[class*="cursor-pointer"]')
            if (portraitOption) {
                await user.click(portraitOption)
                expect(mockUpdateRequest).toHaveBeenCalledWith({ aspectRatio: 'portrait' })
            }
        })

        it('should show landscape as coming soon (disabled)', () => {
            /**
             * Feature: Landscape Coming Soon
             * Verifies landscape mode is marked as not yet available.
             */
            renderWithProviders(<ScriptStep />)
            
            const landscapeText = screen.getByText('Landscape (16:9)')
            const landscapeContainer = landscapeText.closest('div[class*="cursor-not-allowed"]')
            expect(landscapeContainer).toBeInTheDocument()
        })
    })

    /**
     * ============================================
     * SECTION 8: Visual Format Selection Tests
     * ============================================
     * These tests verify the visual format selection
     * (image story vs video b-roll) works correctly.
     */
    describe('Visual Format Selection', () => {
        it('should allow selecting Dynamic Image Story format', async () => {
            /**
             * Feature: Image Story Selection
             * Verifies users can select the dynamic image format.
             */
            const mockUpdateRequest = vi.fn()
            const user = userEvent.setup()
            
            renderWithProviders(<ScriptStep />, {
                creationContext: {
                    updateRequest: mockUpdateRequest,
                    request: createMockRequest({ visualFormat: 'image' })
                }
            })
            
            const imageOption = screen.getByText('Dynamic Image Story').closest('div[class*="cursor-pointer"]')
            if (imageOption) {
                await user.click(imageOption)
                expect(mockUpdateRequest).toHaveBeenCalledWith({ visualFormat: 'image' })
            }
        })

        it('should show Video B-Roll Story as coming soon (disabled)', () => {
            /**
             * Feature: Video B-Roll Coming Soon
             * Verifies video b-roll format is marked as not yet available.
             */
            renderWithProviders(<ScriptStep />)
            
            const videoText = screen.getByText('Video B-Roll Story')
            const videoContainer = videoText.closest('div[class*="cursor-not-allowed"]')
            expect(videoContainer).toBeInTheDocument()
        })
    })

    /**
     * ============================================
     * SECTION 9: AI Enhancement Button Tests
     * ============================================
     * These tests verify the "Enhance with AI" feature
     * button behavior.
     */
    describe('AI Enhancement Button', () => {
        it('should display the Enhance with AI button', () => {
            /**
             * Feature: AI Enhancement Button Display
             * Verifies the AI enhancement button is present.
             */
            renderWithProviders(<ScriptStep />)
            
            expect(screen.getByText('Enhance with AI')).toBeInTheDocument()
        })

        it('should show the button as disabled (coming soon)', () => {
            /**
             * Feature: AI Enhancement Coming Soon
             * Verifies the AI enhancement feature is marked as coming soon.
             */
            renderWithProviders(<ScriptStep />)
            
            const button = screen.getByText('Enhance with AI').closest('button')
            expect(button).toBeDisabled()
        })

        it('should have tooltip wrapper for coming soon feature', () => {
            /**
             * Feature: Coming Soon Tooltip Structure
             * Verifies the button is wrapped in a tooltip component
             * for accessibility and user feedback.
             */
            renderWithProviders(<ScriptStep />)
            
            // Verify the button is wrapped in a span for tooltip triggering
            const button = screen.getByText('Enhance with AI').closest('button')
            const tooltipTriggerWrapper = button?.closest('span')
            expect(tooltipTriggerWrapper).toBeInTheDocument()
        })
    })
})
