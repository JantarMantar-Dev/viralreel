/**
 * MSW Request Handlers for E2E Tests
 *
 * These handlers intercept API requests during E2E tests
 * to return consistent mock data without hitting real services.
 */

import { http, HttpResponse } from 'msw';
import {
  mockScriptGenerateResponse,
  mockScriptRegenerateResponse,
  mockVoices,
  mockNiches,
  mockVideoJob,
  mockSubtitleStyles,
  mockMusic,
  mockSession,
  mockSubscription,
  mockCreditBalance,
} from '../fixtures/mock-responses.js';

const API_BASE = process.env.API_URL || 'http://localhost:3000';

export const handlers = [
  // ============================================================================
  // Authentication
  // ============================================================================

  // Get session
  http.get(`${API_BASE}/api/auth/get-session`, () => {
    return HttpResponse.json(mockSession);
  }),

  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // ============================================================================
  // Script Generation (LLM mocking)
  // ============================================================================

  http.post(`${API_BASE}/api/scripting/generate`, async () => {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json(mockScriptGenerateResponse);
  }),

  http.post(`${API_BASE}/api/scripting/regenerate`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json(mockScriptRegenerateResponse);
  }),

  // ============================================================================
  // Voices
  // ============================================================================

  http.get(`${API_BASE}/api/voices`, () => {
    return HttpResponse.json(mockVoices);
  }),

  http.get(`${API_BASE}/api/voices/:id`, ({ params }) => {
    const voice = mockVoices.find((v) => v.id === params.id);
    if (voice) {
      return HttpResponse.json(voice);
    }
    return HttpResponse.json({ error: 'Voice not found' }, { status: 404 });
  }),

  // ============================================================================
  // Niches
  // ============================================================================

  http.get(`${API_BASE}/api/niches`, () => {
    return HttpResponse.json(mockNiches);
  }),

  http.post(`${API_BASE}/api/niches`, async ({ request }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json({
      id: `niche_${Date.now()}`,
      name: body.name,
      isAdmin: false,
    });
  }),

  // ============================================================================
  // Jobs/Videos
  // ============================================================================

  http.get(`${API_BASE}/api/jobs`, () => {
    return HttpResponse.json([mockVideoJob]);
  }),

  http.get(`${API_BASE}/api/jobs/:videoId`, ({ params }) => {
    return HttpResponse.json({
      ...mockVideoJob,
      id: params.videoId as string,
    });
  }),

  http.post(`${API_BASE}/api/jobs`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      ...mockVideoJob,
      ...body,
      id: `video_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE}/api/jobs/:videoId/render`, ({ params }) => {
    return HttpResponse.json({
      ...mockVideoJob,
      id: params.videoId as string,
      status: 'processing',
    });
  }),

  http.patch(`${API_BASE}/api/jobs/:videoId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      ...mockVideoJob,
      ...body,
      id: params.videoId as string,
    });
  }),

  http.delete(`${API_BASE}/api/jobs/:videoId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // ============================================================================
  // Editor Jobs
  // ============================================================================

  http.post(`${API_BASE}/api/editor-jobs`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      ...mockVideoJob,
      ...body,
      id: `video_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }),

  // ============================================================================
  // Subtitles
  // ============================================================================

  http.get(`${API_BASE}/api/subtitles`, () => {
    return HttpResponse.json(mockSubtitleStyles);
  }),

  // ============================================================================
  // Music
  // ============================================================================

  http.get(`${API_BASE}/api/music`, () => {
    return HttpResponse.json(mockMusic);
  }),

  // ============================================================================
  // Payments
  // ============================================================================

  http.get(`${API_BASE}/api/payments/subscription`, () => {
    return HttpResponse.json(mockSubscription);
  }),

  http.get(`${API_BASE}/api/payments/credit-balance-history`, () => {
    return HttpResponse.json({
      balance: mockCreditBalance.balance,
      transactions: [],
    });
  }),

  // ============================================================================
  // Google AI API (direct calls - if any)
  // ============================================================================

  http.post('https://generativelanguage.googleapis.com/*', () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [{ text: 'Mock LLM response' }],
          },
        },
      ],
    });
  }),
];

/**
 * Handlers for error scenarios
 */
export const errorHandlers = {
  scriptGenerationFailed: http.post(`${API_BASE}/api/scripting/generate`, () => {
    return HttpResponse.json(
      { error: 'LLM service temporarily unavailable' },
      { status: 503 }
    );
  }),

  unauthorized: http.get(`${API_BASE}/api/auth/get-session`, () => {
    return HttpResponse.json(null);
  }),

  rateLimited: http.post(`${API_BASE}/api/scripting/generate`, () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }),
};
