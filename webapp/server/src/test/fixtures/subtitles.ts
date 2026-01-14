/**
 * Mock fixtures for subtitle-related tests
 */

export const mockSubtitles = [
  { text: 'In', start: 0, end: 5 },
  { text: 'a', start: 5, end: 8 },
  { text: 'world', start: 8, end: 20 },
  { text: 'where', start: 20, end: 35 },
  { text: 'technology', start: 35, end: 65 },
  { text: 'and', start: 65, end: 75 },
  { text: 'nature', start: 75, end: 100 },
  { text: 'exist', start: 100, end: 120 },
  { text: 'in', start: 120, end: 125 },
  { text: 'harmony', start: 125, end: 160 },
];

// Groq Whisper API response format (with timestamps in seconds)
export const mockGroqWhisperResponse = {
  text: 'In a world where technology and nature exist in harmony',
  words: [
    { word: 'In', start: 0.0, end: 0.17 },
    { word: 'a', start: 0.17, end: 0.27 },
    { word: 'world', start: 0.27, end: 0.67 },
    { word: 'where', start: 0.67, end: 1.17 },
    { word: 'technology', start: 1.17, end: 2.17 },
    { word: 'and', start: 2.17, end: 2.5 },
    { word: 'nature', start: 2.5, end: 3.33 },
    { word: 'exist', start: 3.33, end: 4.0 },
    { word: 'in', start: 4.0, end: 4.17 },
    { word: 'harmony', start: 4.17, end: 5.33 },
  ],
};
