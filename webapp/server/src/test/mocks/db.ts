/**
 * Database Mock Utilities for Testing
 *
 * Provides helpers for mocking Drizzle ORM database operations
 */

import { vi, type Mock } from 'vitest';

// ============================================================================
// Types
// ============================================================================

export interface MockDbChain {
  from: Mock;
  where: Mock;
  limit: Mock;
  orderBy: Mock;
  set: Mock;
  values: Mock;
  returning: Mock;
  leftJoin: Mock;
  innerJoin: Mock;
  then: <T>(onfulfilled?: (value: T[]) => unknown, onrejected?: (reason: unknown) => unknown) => Promise<unknown>;
}

export interface MockDb {
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  transaction: Mock;
}

// ============================================================================
// Chain Builder
// ============================================================================

/**
 * Creates a chainable mock that resolves to the given result when awaited
 */
export function createDbChain<T = unknown>(result: T[]): MockDbChain {
  const chain: MockDbChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    then: (onfulfilled, onrejected) => {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };
  return chain;
}

// ============================================================================
// Database Mock Factory
// ============================================================================

/**
 * Creates a mock database instance with all common operations
 */
export function createMockDb(): MockDb {
  const mockDb: MockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  };

  // Setup transaction to execute callback immediately with mockDb
  mockDb.transaction.mockImplementation((callback: (tx: MockDb) => Promise<unknown>) => callback(mockDb));

  return mockDb;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

export interface MockUser {
  id: string;
  email: string;
  name: string;
  stripeCustomerId?: string;
  planTag?: string;
  planTagExpiresAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user_test_123',
    email: 'test@example.com',
    name: 'Test User',
    stripeCustomerId: undefined,
    planTag: undefined,
    planTagExpiresAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface MockVideo {
  id: string;
  userId: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scriptIdea: string;
  nicheId?: string;
  duration: number;
  voiceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockVideo(overrides: Partial<MockVideo> = {}): MockVideo {
  return {
    id: 'video_test_123',
    userId: 'user_test_123',
    title: 'Test Video',
    status: 'pending',
    scriptIdea: 'A story about technology',
    nicheId: undefined,
    duration: 1,
    voiceId: 'Zephyr',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface MockNiche {
  id: string;
  name: string;
  userId?: string;
  isAdmin: boolean;
  createdAt: Date;
}

export function createMockNiche(overrides: Partial<MockNiche> = {}): MockNiche {
  return {
    id: 'niche_test_123',
    name: 'Technology',
    userId: undefined,
    isAdmin: true,
    createdAt: new Date(),
    ...overrides,
  };
}

export interface MockVoice {
  id: string;
  name: string;
  voiceId: string;
  language: string;
  gender: string;
  isActive: boolean;
}

export function createMockVoice(overrides: Partial<MockVoice> = {}): MockVoice {
  return {
    id: 'voice_test_123',
    name: 'Zephyr',
    voiceId: 'Zephyr',
    language: 'en',
    gender: 'neutral',
    isActive: true,
    ...overrides,
  };
}

export interface MockSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'cancelled' | 'past_due';
  planId: string;
  currentPeriodEnd: Date;
}

export function createMockSubscription(overrides: Partial<MockSubscription> = {}): MockSubscription {
  return {
    id: 'sub_test_123',
    userId: 'user_test_123',
    stripeSubscriptionId: 'sub_stripe_123',
    status: 'active',
    planId: 'plan_test_123',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

export interface MockPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  interval: 'month' | 'year';
  creditsInterval: 'month' | 'year';
  isActive: boolean;
  tag?: string;
}

export function createMockPlan(overrides: Partial<MockPlan> = {}): MockPlan {
  return {
    id: 'plan_test_123',
    name: 'Pro Plan',
    price: 1000,
    currency: 'usd',
    credits: 100,
    interval: 'month',
    creditsInterval: 'month',
    isActive: true,
    tag: undefined,
    ...overrides,
  };
}
