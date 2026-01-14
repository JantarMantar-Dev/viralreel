/**
 * LLM Provider Mocks for Testing
 *
 * This module provides mock implementations for all LLM providers used in the application:
 * - Google ADK (Gemini for scripts, TTS, segmentation, visualization)
 * - Groq SDK (Whisper for transcription)
 * - Google Generative AI (Image generation)
 */

import { vi, type Mock } from 'vitest';
import { mockScriptStory } from '../fixtures/scripts.js';
import { mockPcmBase64 } from '../fixtures/audio.js';
import { mockGroqWhisperResponse } from '../fixtures/subtitles.js';
import { mockSegmenterOutput, mockVisualizerOutput } from '../fixtures/segments.js';
import { mockImageBase64 } from '../fixtures/images.js';

// ============================================================================
// Types
// ============================================================================

export interface MockRunnerSession {
  id: string;
  userId: string;
}

export interface MockEventContent {
  parts: Array<{ text?: string; inlineData?: { data: string } }>;
}

export interface MockEvent {
  author: string;
  content: MockEventContent;
}

// ============================================================================
// Async Generator Helpers
// ============================================================================

/**
 * Creates a mock async generator that yields events for a given agent
 */
function createMockEventGenerator(agentName: string, output: unknown): () => AsyncGenerator<MockEvent> {
  return async function* () {
    yield {
      author: agentName,
      content: {
        parts: [{ text: typeof output === 'string' ? output : JSON.stringify(output) }],
      },
    };
  };
}

/**
 * Creates a mock async generator for audio output
 */
function createMockAudioGenerator(agentName: string, audioData: string): () => AsyncGenerator<MockEvent> {
  return async function* () {
    yield {
      author: agentName,
      content: {
        parts: [{ inlineData: { data: audioData } }],
      },
    };
  };
}

// ============================================================================
// Google ADK Mock
// ============================================================================

export interface GoogleAdkMock {
  LlmAgent: Mock;
  InMemoryRunner: Mock;
  SequentialAgent: Mock;
  Gemini: Mock;
  LLMRegistry: { register: Mock };
  zodObjectToSchema: Mock;
  BuiltInCodeExecutor: new () => object;
}

/**
 * Creates a comprehensive mock for @google/adk
 *
 * This mock handles:
 * - LlmAgent creation
 * - InMemoryRunner with sessionService and runAsync
 * - Different agent types (script_writer, segmenter, visualizer, audio_generator)
 */
export function createGoogleAdkMock(): GoogleAdkMock {
  const mockSessionService = {
    createSession: vi.fn().mockResolvedValue({
      id: 'test_session_123',
      userId: 'system',
    } as MockRunnerSession),
  };

  const mockRunAsync = vi.fn();

  const mockRunner = {
    sessionService: mockSessionService,
    runAsync: mockRunAsync,
  };

  const mockLlmAgent = vi.fn().mockImplementation((config: { name: string; description?: string }) => ({
    name: config.name,
    model: {},
    description: config.description || '',
  }));

  const mockInMemoryRunner = vi.fn().mockImplementation(({ agent }: { agent: { name: string } }) => {
    // Configure runAsync based on agent name
    mockRunAsync.mockImplementation(() => {
      switch (agent.name) {
        case 'script_writer':
          // For editor mode (plain text output)
          return createMockEventGenerator('script_writer', mockScriptStory)();
        case 'segmenter':
          return createMockEventGenerator('segmenter', mockSegmenterOutput)();
        case 'visualizer':
          return createMockEventGenerator('visualizer', mockVisualizerOutput)();
        case 'audio_generator':
          return createMockAudioGenerator('audio_generator', mockPcmBase64)();
        case 'subtitle_generator':
          return createMockEventGenerator('subtitle_generator', { subtitles: [] })();
        default:
          return createMockEventGenerator(agent.name, { result: 'mock_result' })();
      }
    });

    return mockRunner;
  });

  const mockGemini = vi.fn().mockImplementation(() => ({
    model: 'gemini-mock',
  }));

  const mockLLMRegistry = {
    register: vi.fn(),
  };

  // Simple passthrough for schema conversion
  const mockZodObjectToSchema = vi.fn().mockImplementation((schema: unknown) => schema);

  // No-op code executor
  class MockBuiltInCodeExecutor {
    processLlmRequest(): void {
      // No-op
    }
  }

  return {
    LlmAgent: mockLlmAgent,
    InMemoryRunner: mockInMemoryRunner,
    SequentialAgent: vi.fn(),
    Gemini: mockGemini,
    LLMRegistry: mockLLMRegistry,
    zodObjectToSchema: mockZodObjectToSchema,
    BuiltInCodeExecutor: MockBuiltInCodeExecutor,
  };
}

// ============================================================================
// Groq SDK Mock
// ============================================================================

export interface GroqMock {
  default: Mock;
}

/**
 * Creates a mock for groq-sdk (Whisper transcription)
 */
export function createGroqMock(): Mock {
  return vi.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue(mockGroqWhisperResponse),
      },
    },
  }));
}

// ============================================================================
// Google Generative AI Mock (for direct image generation)
// ============================================================================

export interface GoogleGenerativeAiMock {
  GoogleGenerativeAI: Mock;
}

/**
 * Creates a mock for @google/generative-ai (image generation)
 */
export function createGoogleGenerativeAiMock(): GoogleGenerativeAiMock {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            candidates: [
              {
                content: {
                  parts: [{ inlineData: { data: mockImageBase64 } }],
                },
              },
            ],
          },
        }),
      }),
    })),
  };
}

// ============================================================================
// Fetch Mock for Direct API Calls
// ============================================================================

/**
 * Creates a mock fetch function that handles Google AI API calls
 */
export function createFetchMock(): Mock {
  return vi.fn().mockImplementation((url: string) => {
    // Handle Google Generative Language API (image generation)
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

    // Default fallback for other URLs
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
  });
}

// ============================================================================
// Combined Setup Helper
// ============================================================================

/**
 * Sets up all LLM mocks at once
 * Call this in your test setup file
 */
export function setupAllLlmMocks(): {
  googleAdkMock: GoogleAdkMock;
  groqMock: Mock;
  googleGenAiMock: GoogleGenerativeAiMock;
  fetchMock: Mock;
} {
  const googleAdkMock = createGoogleAdkMock();
  const groqMock = createGroqMock();
  const googleGenAiMock = createGoogleGenerativeAiMock();
  const fetchMock = createFetchMock();

  return {
    googleAdkMock,
    groqMock,
    googleGenAiMock,
    fetchMock,
  };
}
