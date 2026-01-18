/**
 * Test Utilities
 * 
 * This file provides reusable test utilities:
 * - Mock providers for wrapping components under test
 * - Factory functions for creating test data
 * - Custom render function with all required providers
 */

import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreationContext, CreationContextType, VideoJobRequest, INITIAL_REQUEST } from '@/pages/dashboard/create/context/creation-context'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * Creates a mock VideoJobRequest with optional overrides
 * Use this to generate test data with sensible defaults
 */
export function createMockRequest(overrides: Partial<VideoJobRequest> = {}): VideoJobRequest {
    return {
        ...INITIAL_REQUEST,
        ...overrides,
    }
}

/**
 * Creates a mock CreationContext value with optional overrides
 * Use this when testing components that consume the CreationContext
 */
export function createMockCreationContext(overrides: Partial<CreationContextType> = {}): CreationContextType {
    return {
        request: createMockRequest(overrides.request),
        updateRequest: overrides.updateRequest ?? vi.fn(),
        nextStep: overrides.nextStep ?? vi.fn(),
        prevStep: overrides.prevStep ?? vi.fn(),
        currentStep: overrides.currentStep ?? 2,
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

/**
 * Creates a fresh QueryClient for each test
 * Configured to disable retries and caching for predictable test behavior
 */
export function createTestQueryClient() {
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

interface WrapperProps {
    children: ReactNode
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    creationContext?: Partial<CreationContextType>
    queryClient?: QueryClient
}

/**
 * Custom render function that wraps components with all necessary providers
 * 
 * @param ui - The component to render
 * @param options - Render options including context overrides
 * @returns The render result plus the mocked context for assertions
 */
export function renderWithProviders(
    ui: ReactNode,
    {
        creationContext = {},
        queryClient = createTestQueryClient(),
        ...renderOptions
    }: CustomRenderOptions = {}
) {
    const mockContext = createMockCreationContext(creationContext)

    function Wrapper({ children }: WrapperProps) {
        return (
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <TooltipProvider>
                        <CreationContext.Provider value={mockContext}>
                            {children}
                        </CreationContext.Provider>
                    </TooltipProvider>
                </BrowserRouter>
            </QueryClientProvider>
        )
    }

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        mockContext,
    }
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
