import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pack } from '../pack';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>();
  return { ...actual, runCommand: vi.fn(), prepareArgs: vi.fn() };
});

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('pack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockImplementation((options) => {
      const args: string[] = [];
      Object.entries(options).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value) {
          args.push(`--${key}`);
        } else if (value !== undefined && value !== null && typeof value !== 'boolean') {
          args.push(`--${key}`, String(value));
        }
      });
      return args;
    });
    mockRunCommand.mockResolvedValue({ stdout: 'Pack completed successfully', stderr: '', exitCode: 0 });
  });

  it('should return a CancellablePromise with a cancel method', () => {
    const op = pack();
    expect(op).toBeInstanceOf(Promise);
    expect(typeof op.cancel).toBe('function');
    return op;
  });

  it('should call runCommand with default directory when no arguments provided', async () => {
    await pack();

    expect(mockRunCommand).toHaveBeenCalledWith('pack', ['.'], undefined, { signal: expect.any(AbortSignal) });
  });

  it('should call runCommand with specified directory', async () => {
    await pack('/path/to/project');

    expect(mockRunCommand).toHaveBeenCalledWith('pack', ['/path/to/project'], undefined, { signal: expect.any(AbortSignal) });
  });

  it('should handle pack with all flags', async () => {
    const flags = {
      file: 'Kitfile',
      tag: 'my-model:v1.0.0',
      compression: 'gzip',
      useModelPack: true
    };

    await pack('./src', flags);

    expect(prepareArgs).toHaveBeenCalledWith(flags);
    expect(mockRunCommand).toHaveBeenCalledWith('pack', [
      './src',
      '--file', 'Kitfile',
      '--tag', 'my-model:v1.0.0',
      '--compression', 'gzip',
      '--useModelPack'
    ], undefined, { signal: expect.any(AbortSignal) });
  });

  it('should handle pack with partial flags', async () => {
    const flags = {
      file: 'CustomKitfile',
      tag: 'test-model:latest',
      compression: 'none',
      useModelPack: false
    };

    await pack('.', flags);

    expect(prepareArgs).toHaveBeenCalledWith(flags);
    expect(mockRunCommand).toHaveBeenCalledWith('pack', [
      '.',
      '--file', 'CustomKitfile',
      '--tag', 'test-model:latest',
      '--compression', 'none'
    ], undefined, { signal: expect.any(AbortSignal) });
  });

  it('should handle pack with only file flag', async () => {
    const flags = {
      file: 'MyKitfile',
      tag: '',
      compression: '',
      useModelPack: false
    };

    mockPrepareArgs.mockReturnValue(['--file', 'MyKitfile']);

    await pack('./models', flags);

    expect(prepareArgs).toHaveBeenCalledWith(flags);
    expect(mockRunCommand).toHaveBeenCalledWith('pack', [
      './models',
      '--file', 'MyKitfile'
    ], undefined, { signal: expect.any(AbortSignal) });
  });

  it('should handle pack with only useModelPack flag', async () => {
    const flags = {
      file: '',
      tag: '',
      compression: '',
      useModelPack: true
    };

    mockPrepareArgs.mockReturnValue(['--useModelPack']);

    await pack('.', flags);

    expect(prepareArgs).toHaveBeenCalledWith(flags);
    expect(mockRunCommand).toHaveBeenCalledWith('pack', [
      '.',
      '--useModelPack'
    ], undefined, { signal: expect.any(AbortSignal) });
  });

  it('should propagate errors from runCommand', async () => {
    const errorMessage = 'Kit command failed with exit code 1: Kitfile not found';
    mockRunCommand.mockRejectedValue(new Error(errorMessage));

    await expect(pack('./nonexistent')).rejects.toThrow(errorMessage);
  });

  it('should handle different compression types', async () => {
    const compressionTypes = ['gzip', 'zstd', 'none'];

    for (const compression of compressionTypes) {
      const flags = { file: 'Kitfile', tag: 'model:latest', compression, useModelPack: false };

      mockPrepareArgs.mockReturnValue([
        '--file', 'Kitfile',
        '--tag', 'model:latest',
        '--compression', compression
      ]);

      await pack('.', flags);

      expect(mockRunCommand).toHaveBeenCalledWith('pack', [
        '.',
        '--file', 'Kitfile',
        '--tag', 'model:latest',
        '--compression', compression
      ], undefined, { signal: expect.any(AbortSignal) });
    }
  });

  it('should handle different tag formats', async () => {
    const tagFormats = [
      'simple-model:v1.0.0',
      'registry.example.com/org/model:latest',
      'localhost:5000/my-model:dev',
      'model',
      'my-model:v2.1.0-alpha.1'
    ];

    for (const tag of tagFormats) {
      const flags = { file: 'Kitfile', tag, compression: 'gzip', useModelPack: false };

      mockPrepareArgs.mockReturnValue([
        '--file', 'Kitfile',
        '--tag', tag,
        '--compression', 'gzip'
      ]);

      await pack('.', flags);

      expect(mockRunCommand).toHaveBeenCalledWith('pack', [
        '.',
        '--file', 'Kitfile',
        '--tag', tag,
        '--compression', 'gzip'
      ], undefined, { signal: expect.any(AbortSignal) });
    }
  });

  it('should handle relative and absolute directory paths', async () => {
    const directories = ['.', './src', '../project', '/absolute/path/to/project', '~/home/user/project'];

    for (const directory of directories) {
      await pack(directory);
      expect(mockRunCommand).toHaveBeenCalledWith('pack', [directory], undefined, { signal: expect.any(AbortSignal) });
    }
  });

  it('should handle pack command execution failure', async () => {
    mockRunCommand.mockRejectedValue(new Error('Failed to execute kit command: permission denied'));

    await expect(pack('./restricted-dir'))
      .rejects.toThrow('Failed to execute kit command: permission denied');
  });

  it('should handle invalid Kitfile path', async () => {
    const kitfileError = 'Kit command failed with exit code 1: invalid Kitfile path';
    mockRunCommand.mockRejectedValue(new Error(kitfileError));

    const flags = { file: '/invalid/path/Kitfile', tag: 'model:latest', compression: 'gzip', useModelPack: false };

    await expect(pack('.', flags)).rejects.toThrow('Kit command failed with exit code 1: invalid Kitfile path');
  });

  it('should handle successful pack operation', async () => {
    const flags = { file: 'Kitfile', tag: 'model:v1.0.0', compression: 'gzip', useModelPack: true };

    await expect(pack('./project', flags)).resolves.not.toThrow();
  });

  it('should abort the signal when cancel is called', () => {
    let capturedSignal: AbortSignal | undefined;

    mockRunCommand.mockImplementation((_cmd, _args, _stdin, opts) => {
      capturedSignal = opts?.signal;
      return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 });
    });

    const op = pack('.');
    expect(capturedSignal?.aborted).toBe(false);
    op.cancel();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
