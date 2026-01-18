/**
 * Test Utilities - Main Export
 *
 * Centralized exports for all test helpers, mocks, and fixtures
 */

// Fixtures
export * from './fixtures/scripts.js';
export * from './fixtures/audio.js';
export * from './fixtures/subtitles.js';
export * from './fixtures/segments.js';
export * from './fixtures/images.js';

// Mocks
export * from './mocks/llm-providers.js';
export {
  createDbChain,
  createMockDb,
  createMockVideo,
  createMockNiche,
  createMockVoice,
  createMockSubscription,
  createMockPlan,
  type MockDbChain,
  type MockDb,
  type MockVideo,
  type MockNiche,
  type MockVoice,
  type MockSubscription,
  type MockPlan,
} from './mocks/db.js';
// Rename MockUser from db.ts to avoid conflict with helpers/fastify.ts
export { createMockUser, type MockUser as DbMockUser } from './mocks/db.js';

// Helpers
export * from './helpers/fastify.js';
