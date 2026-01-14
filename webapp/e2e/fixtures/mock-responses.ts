/**
 * Mock Fixtures for E2E Tests
 *
 * Contains realistic mock data that matches API response shapes
 */

// ============================================================================
// Script Generation
// ============================================================================

export const mockScriptStory = `In a world where technology and nature exist in harmony, a young scientist named Maya discovers an ancient algorithm hidden within the genetic code of redwood trees. As she deciphers its secrets, she realizes it holds the key to sustainable energy that could power the entire planet. But powerful corporations will stop at nothing to control this discovery.`;

export const mockScriptGenerateResponse = {
  success: true,
  script: {
    story: mockScriptStory,
    wordCount: 67,
    estimatedDurationSeconds: 27,
  },
};

export const mockScriptRegenerateResponse = {
  success: true,
  script: {
    story: `In a DRAMATIC world where technology and nature clash in an epic battle, a brilliant young scientist named Maya uncovers a hidden algorithm buried deep within ancient redwood trees. The stakes couldn't be higher as she races against time to unlock its world-changing secrets.`,
    wordCount: 52,
    estimatedDurationSeconds: 21,
  },
};

// ============================================================================
// Voices
// ============================================================================

export const mockVoices = [
  {
    id: 'voice_1',
    name: 'Zephyr',
    voiceId: 'Zephyr',
    language: 'en',
    gender: 'neutral',
    isActive: true,
  },
  {
    id: 'voice_2',
    name: 'Kore',
    voiceId: 'Kore',
    language: 'en',
    gender: 'female',
    isActive: true,
  },
  {
    id: 'voice_3',
    name: 'Charon',
    voiceId: 'Charon',
    language: 'en',
    gender: 'male',
    isActive: true,
  },
];

// ============================================================================
// Niches
// ============================================================================

export const mockNiches = [
  { id: 'niche_1', name: 'Technology', isAdmin: true },
  { id: 'niche_2', name: 'Science', isAdmin: true },
  { id: 'niche_3', name: 'History', isAdmin: true },
  { id: 'niche_4', name: 'Entertainment', isAdmin: true },
];

// ============================================================================
// Videos/Jobs
// ============================================================================

export const mockVideoJob = {
  id: 'video_test_123',
  userId: 'user_test_123',
  title: 'Test Video',
  status: 'pending',
  scriptIdea: 'A story about AI and nature',
  nicheId: 'niche_1',
  duration: 1,
  voiceId: 'Zephyr',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockVideoJobProcessing = {
  ...mockVideoJob,
  status: 'processing',
};

export const mockVideoJobCompleted = {
  ...mockVideoJob,
  status: 'completed',
  videoUrl: 'https://example.com/videos/test_video.mp4',
  thumbnailUrl: 'https://example.com/thumbnails/test_video.jpg',
};

// ============================================================================
// Subtitles
// ============================================================================

export const mockSubtitleStyles = [
  {
    id: 'style_1',
    name: 'Classic White',
    fontFamily: 'Inter',
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: 'transparent',
    position: 'bottom',
  },
  {
    id: 'style_2',
    name: 'Bold Yellow',
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontColor: '#FFFF00',
    backgroundColor: '#000000',
    position: 'bottom',
  },
];

// ============================================================================
// Music
// ============================================================================

export const mockMusic = [
  {
    id: 'music_1',
    name: 'Upbeat Energy',
    url: 'https://example.com/music/upbeat.mp3',
    duration: 180,
  },
  {
    id: 'music_2',
    name: 'Calm Ambience',
    url: 'https://example.com/music/calm.mp3',
    duration: 240,
  },
];

// ============================================================================
// User/Auth
// ============================================================================

export const mockUser = {
  id: 'user_test_123',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  createdAt: new Date().toISOString(),
};

export const mockSession = {
  user: mockUser,
  session: {
    id: 'session_123',
    userId: 'user_test_123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
};

// ============================================================================
// Subscriptions
// ============================================================================

export const mockSubscription = {
  id: 'sub_test_123',
  userId: 'user_test_123',
  planId: 'plan_pro',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockCreditBalance = {
  userId: 'user_test_123',
  balance: 100,
};
