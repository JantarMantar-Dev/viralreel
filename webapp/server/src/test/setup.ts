/**
 * Global Test Setup for Server Integration Tests
 *
 * This file is loaded before all tests and sets up:
 * - Environment variables for testing
 * - Global mocks for LLM providers
 * - Fetch mock for external API calls
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// ============================================================================
// Environment Setup
// ============================================================================

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.GOOGLE_API_KEY = 'test-api-key';
process.env.GOOGLE_SCRIPT_MODEL = 'gemini-test-model';
process.env.GOOGLE_TTS_MODEL = 'gemini-tts-test';
process.env.GOOGLE_TTS_VOICE = 'Zephyr';
process.env.GOOGLE_IMAGE_MODEL = 'gemini-image-test';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.GROQ_TTS_KEY = 'test-groq-tts-key';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';

// ============================================================================
// LLM Provider Mocks (Hoisted)
// ============================================================================

// These mocks need to be hoisted so they're applied before module loading
const {
  mockLlmAgent,
  mockInMemoryRunner,
  mockGemini,
  mockLLMRegistry,
  mockZodObjectToSchema,
  MockBuiltInCodeExecutor,
  mockGroq,
  mockFetch,
} = vi.hoisted(() => {
  // Import fixtures inline to avoid circular deps
  const mockScriptStory = 'In a world where technology and nature exist in harmony...';
  const mockPcmBase64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const mockSegmenterOutput = {
    segments: [
      { dialogue: 'In a world...', start: 0, end: 90, duration: 3.0 },
      { dialogue: 'A young scientist...', start: 90, end: 180, duration: 3.0 },
    ],
  };

  const mockVisualizerOutput = {
    segments: mockSegmenterOutput.segments.map((s, i) => ({
      ...s,
      visualPrompt: `Cinematic scene ${i + 1}`,
    })),
  };

  const mockGroqWhisperResponse = {
    text: 'In a world where technology and nature exist in harmony',
    words: [
      { word: 'In', start: 0.0, end: 0.17 },
      { word: 'a', start: 0.17, end: 0.27 },
      { word: 'world', start: 0.27, end: 0.67 },
    ],
  };

  // Create async generator helper
  const createMockEventGenerator = (agentName: string, output: unknown) => {
    return async function* () {
      yield {
        author: agentName,
        content: {
          parts: [{ text: typeof output === 'string' ? output : JSON.stringify(output) }],
        },
      };
    };
  };

  const createMockAudioGenerator = (agentName: string, audioData: string) => {
    return async function* () {
      yield {
        author: agentName,
        content: {
          parts: [{ inlineData: { data: audioData } }],
        },
      };
    };
  };

  // Mock session service
  const mockSessionService = {
    createSession: vi.fn().mockResolvedValue({
      id: 'test_session_123',
      userId: 'system',
    }),
  };

  const mockRunAsync = vi.fn();

  const mockRunner = {
    sessionService: mockSessionService,
    runAsync: mockRunAsync,
  };

  // LlmAgent mock
  const mockLlmAgent = vi.fn().mockImplementation((config: { name: string }) => ({
    name: config.name,
    model: {},
  }));

  // InMemoryRunner mock
  const mockInMemoryRunner = vi.fn().mockImplementation(({ agent }: { agent: { name: string } }) => {
    mockRunAsync.mockImplementation(() => {
      switch (agent.name) {
        case 'script_writer':
          return createMockEventGenerator('script_writer', mockScriptStory)();
        case 'segmenter':
          return createMockEventGenerator('segmenter', mockSegmenterOutput)();
        case 'visualizer':
          return createMockEventGenerator('visualizer', mockVisualizerOutput)();
        case 'audio_generator':
          return createMockAudioGenerator('audio_generator', mockPcmBase64)();
        default:
          return createMockEventGenerator(agent.name, { result: 'mock' })();
      }
    });
    return mockRunner;
  });

  const mockGemini = vi.fn().mockReturnValue({ model: 'gemini-mock' });

  const mockLLMRegistry = { register: vi.fn() };

  const mockZodObjectToSchema = vi.fn().mockImplementation((s: unknown) => s);

  class MockBuiltInCodeExecutor {
    processLlmRequest(): void {}
  }

  // Groq mock
  const mockGroq = vi.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue(mockGroqWhisperResponse),
      },
    },
  }));

  // Fetch mock
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ inlineData: { data: mockImageBase64 } }],
                },
              },
            ],
          }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
  });

  return {
    mockLlmAgent,
    mockInMemoryRunner,
    mockGemini,
    mockLLMRegistry,
    mockZodObjectToSchema,
    MockBuiltInCodeExecutor,
    mockGroq,
    mockFetch,
  };
});

// ============================================================================
// Apply Module Mocks
// ============================================================================

// Mock @google/adk
vi.mock('@google/adk', () => ({
  LlmAgent: mockLlmAgent,
  InMemoryRunner: mockInMemoryRunner,
  SequentialAgent: vi.fn(),
  Gemini: mockGemini,
  LLMRegistry: mockLLMRegistry,
  zodObjectToSchema: mockZodObjectToSchema,
  BuiltInCodeExecutor: MockBuiltInCodeExecutor,
}));

// Mock groq-sdk
vi.mock('groq-sdk', () => ({
  default: mockGroq,
}));

// ============================================================================
// Global Setup
// ============================================================================

beforeAll(() => {
  // Mock global fetch
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  // Clear all mocks between tests
  vi.clearAllMocks();
});

afterAll(() => {
  // Restore mocks after all tests
  vi.restoreAllMocks();
});

// ============================================================================
// Export mocks for test access
// ============================================================================

export {
  mockLlmAgent,
  mockInMemoryRunner,
  mockGemini,
  mockLLMRegistry,
  mockGroq,
  mockFetch,
};
