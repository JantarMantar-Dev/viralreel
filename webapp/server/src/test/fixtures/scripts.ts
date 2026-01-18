/**
 * Mock fixtures for script-related tests
 */

export const mockScriptStory = `In a world where technology and nature exist in harmony, a young scientist named Maya discovers an ancient algorithm hidden within the genetic code of redwood trees. As she deciphers its secrets, she realizes it holds the key to sustainable energy that could power the entire planet. But powerful corporations will stop at nothing to control this discovery.`;

export const mockShortScriptStory = `The future of AI is not about replacing humans, but augmenting our capabilities. Together, we can solve problems that seemed impossible just a decade ago.`;

export const mockRegeneratedScriptStory = `In a DRAMATIC world where technology and nature clash in an epic battle, a brilliant young scientist named Maya uncovers a hidden algorithm buried deep within ancient redwood trees. The stakes couldn't be higher as she races against time to unlock its world-changing secrets.`;

export const mockScriptResponse = {
  story: mockScriptStory,
};

export const mockWordCount = 67;
export const mockEstimatedSeconds = 27;

export const mockScriptGenerateResponse = {
  success: true,
  script: {
    story: mockScriptStory,
    wordCount: mockWordCount,
    estimatedDurationSeconds: mockEstimatedSeconds,
  },
};

export const mockRegenerateResponse = {
  success: true,
  script: {
    story: mockRegeneratedScriptStory,
    wordCount: 52,
    estimatedDurationSeconds: 21,
  },
};
