/**
 * Mock fixtures for image generation tests
 */

// A 1x1 transparent PNG (base64 encoded) for testing
export const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// A 1x1 red PNG for visual distinction in tests
export const mockRedImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export const mockImageGenerationResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            inlineData: {
              data: mockImageBase64,
              mimeType: 'image/png',
            },
          },
        ],
      },
    },
  ],
};
