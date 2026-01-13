/**
 * Test Setup File
 * 
 * This file configures the testing environment for all tests:
 * - Extends expect with DOM matchers from @testing-library/jest-dom
 * - Sets up global mocks for browser APIs not available in jsdom
 * - Configures cleanup after each test
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test to prevent memory leaks and test pollution
afterEach(() => {
    cleanup()
})

// Mock window.matchMedia which is not implemented in jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock ResizeObserver as a proper class (required for Radix UI components)
class ResizeObserverMock {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
}

global.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver as a proper class
class IntersectionObserverMock {
    root = null
    rootMargin = ''
    thresholds: number[] = []
    
    constructor() {}
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn().mockReturnValue([])
}

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver

// Mock scrollIntoView which is not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn()

// Mock PointerEvent for Radix UI components
class PointerEventMock extends MouseEvent {
    pointerId: number
    pointerType: string
    
    constructor(type: string, props: PointerEventInit = {}) {
        super(type, props)
        this.pointerId = props.pointerId || 0
        this.pointerType = props.pointerType || 'mouse'
    }
}

global.PointerEvent = PointerEventMock as unknown as typeof PointerEvent
