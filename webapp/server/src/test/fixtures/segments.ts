/**
 * Mock fixtures for video segments
 */

export const mockSegments = [
  {
    dialogue: 'In a world where technology and nature exist in harmony',
    start: 0,
    end: 160,
    duration: 5.33,
  },
  {
    dialogue: 'a young scientist named Maya discovers an ancient algorithm',
    start: 160,
    end: 320,
    duration: 5.33,
  },
  {
    dialogue: 'hidden within the genetic code of redwood trees',
    start: 320,
    end: 450,
    duration: 4.33,
  },
];

export const mockSegmentsWithVisuals = mockSegments.map((segment, index) => ({
  ...segment,
  visualPrompt: `Cinematic shot ${index + 1}: A beautifully composed scene depicting ${segment.dialogue.substring(0, 30)}...`,
}));

export const mockSegmenterOutput = {
  segments: mockSegments,
};

export const mockVisualizerOutput = {
  segments: mockSegmentsWithVisuals,
};
