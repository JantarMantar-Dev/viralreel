import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressVideo } from '../video';
import EventEmitter from 'events';

// Mock child_process
vi.mock('child_process', () => {
  return {
    spawn: vi.fn(),
  };
});

// Mock logger to avoid cluttering test output
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

import { spawn } from 'child_process';

describe('compressVideo', () => {
  const mockSpawn = spawn as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve immediately when ffmpeg exits with code 0', async () => {
    const processMock = new EventEmitter() as any;
    processMock.stderr = new EventEmitter();
    processMock.kill = vi.fn();
    
    // Simulate spawn returning a process
    mockSpawn.mockReturnValue(processMock);

    const promise = compressVideo('input.mp4', 'output.mp4');

    // Emit close event
    processMock.emit('close', 0);

    await expect(promise).resolves.toBeUndefined();

    // Verify spawn was called with correct args
    expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining([
      '-y',
      '-i', 'input.mp4',
      'output.mp4'
    ]));
    
    // Check specific flags
    expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining([
      '-vcodec', 'libx264',
      '-movflags', '+faststart'
    ]));
  });

  it('should reject when ffmpeg exits with non-zero code', async () => {
    const processMock = new EventEmitter() as any;
    processMock.stderr = new EventEmitter();
    
    mockSpawn.mockReturnValue(processMock);

    const promise = compressVideo('input.mp4', 'output.mp4');

    processMock.emit('close', 1);

    await expect(promise).rejects.toThrow('ffmpeg exited with code 1');
  });

  it('should reject when ffmpeg emits error', async () => {
    const processMock = new EventEmitter() as any;
    processMock.stderr = new EventEmitter();
    
    mockSpawn.mockReturnValue(processMock);

    const promise = compressVideo('input.mp4', 'output.mp4');

    const error = new Error('Spawn failed');
    processMock.emit('error', error);

    await expect(promise).rejects.toThrow('Spawn failed');
  });

  it('should use custom options when provided', async () => {
    const processMock = new EventEmitter() as any;
    processMock.stderr = new EventEmitter();
    
    mockSpawn.mockReturnValue(processMock);

    const promise = compressVideo('input.mp4', 'output.mp4', { crf: 20, preset: 'slow' });

    processMock.emit('close', 0);

    await expect(promise).resolves.toBeUndefined();

    expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining([
      '-crf', '20',
      '-preset', 'slow'
    ]));
  });
});
