/**
 * Mock fixtures for audio-related tests
 */

// A minimal valid WAV header + some data (base64 encoded)
// This is a tiny valid WAV file structure for testing
export const mockAudioBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Mock PCM audio data (raw)
export const mockPcmBase64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

// Duration in frames (at 30fps)
export const mockAudioDurationFrames = 150; // 5 seconds

// Duration in seconds
export const mockAudioDurationSeconds = 5;
