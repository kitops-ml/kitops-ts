import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pack } from '../pack';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('pack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock prepareArgs to return the expected array format
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
  });

  it('should call runCommand with default directory when no arguments provided', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

    await pack();

    expect(mockRunCommand).toHaveBeenCalledWith('pack', ['.']);
  });

  it('should call runCommand with specified directory', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

    await pack('/path/to/project');

    expect(mockRunCommand).toHaveBeenCalledWith('pack', ['/path/to/project']);
  });

  it('should handle pack with all flags', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

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
    ]);
  });

  it('should handle pack with partial flags', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

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
    ]);
  });

  it('should handle pack with only file flag', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

    const flags = {
      file: 'MyKitfile',
      tag: '',
      compression: '',
      useModelPack: false
    };

    // Mock prepareArgs to handle empty strings appropriately
    mockPrepareArgs.mockReturnValue(['--file', 'MyKitfile']);

    await pack('./models', flags);

    expect(prepareArgs).toHaveBeenCalledWith(flags);
    expect(mockRunCommand).toHaveBeenCalledWith('pack', [
      './models',
      '--file', 'MyKitfile'
    ]);
  });

  it('should handle pack with only useModelPack flag', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

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
    ]);
  });

  it('should propagate errors from runCommand', async () => {
    const errorMessage = 'Kit command failed with exit code 1: Kitfile not found';
    mockRunCommand.mockRejectedValue(new Error(errorMessage));

    await expect(pack('./nonexistent'))
      .rejects.toThrow(errorMessage);
  });

  it('should handle different compression types', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

    const compressionTypes = ['gzip', 'zstd', 'none'];

    for (const compression of compressionTypes) {
      const flags = {
        file: 'Kitfile',
        tag: 'model:latest',
        compression,
        useModelPack: false
      };

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
      ]);
    }
  });

  it('should handle different tag formats', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

    const tagFormats = [
      'simple-model:v1.0.0',
      'registry.example.com/org/model:latest',
      'localhost:5000/my-model:dev',
      'model',
      'my-model:v2.1.0-alpha.1'
    ];

    for (const tag of tagFormats) {
      const flags = {
        file: 'Kitfile',
        tag,
        compression: 'gzip',
        useModelPack: false
      };

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
      ]);
    }
  });

  it('should handle relative and absolute directory paths', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Pack completed successfully',
      stderr: '',
      exitCode: 0
    });

    const directories = [
      '.',
      './src',
      '../project',
      '/absolute/path/to/project',
      '~/home/user/project'
    ];

    for (const directory of directories) {
      await pack(directory);
      expect(mockRunCommand).toHaveBeenCalledWith('pack', [directory]);
    }
  });

  it('should handle pack command execution failure', async () => {
    const execError = 'Failed to execute kit command: permission denied';
    mockRunCommand.mockRejectedValue(new Error(execError));

    await expect(pack('./restricted-dir'))
      .rejects.toThrow('Failed to execute kit command: permission denied');
  });

  it('should handle invalid Kitfile path', async () => {
    const kitfileError = 'Kit command failed with exit code 1: invalid Kitfile path';
    mockRunCommand.mockRejectedValue(new Error(kitfileError));

    const flags = {
      file: '/invalid/path/Kitfile',
      tag: 'model:latest',
      compression: 'gzip',
      useModelPack: false
    };

    await expect(pack('.', flags))
      .rejects.toThrow('Kit command failed with exit code 1: invalid Kitfile path');
  });

  it('should handle successful pack operation', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'Successfully packed model:v1.0.0',
      stderr: '',
      exitCode: 0
    });

    const flags = {
      file: 'Kitfile',
      tag: 'model:v1.0.0',
      compression: 'gzip',
      useModelPack: true
    };

    await expect(pack('./project', flags)).resolves.not.toThrow();
  });
});