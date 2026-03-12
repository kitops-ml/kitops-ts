import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remove, removeAll } from '../remove';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should call runCommand with the path when no flags are given', async () => {
    await remove('registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith('remove', ['registry.example.com/org/my-model:v1.0.0']);
  });

  it('should omit the path and add --all when all flag is set', async () => {
    mockPrepareArgs.mockReturnValue(['--all']);

    await remove('registry.example.com/org/my-model:v1.0.0', { all: true });

    expect(mockRunCommand).toHaveBeenCalledWith('remove', ['--all']);
  });

  it('should pass additional flags alongside the path', async () => {
    mockPrepareArgs.mockReturnValue(['--force', '--remote']);

    await remove('registry.example.com/org/my-model:v1.0.0', { force: true, remote: true });

    expect(mockRunCommand).toHaveBeenCalledWith('remove', [
      'registry.example.com/org/my-model:v1.0.0',
      '--force',
      '--remote',
    ]);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'));

    await expect(remove('registry.example.com/org/my-model:v1.0.0'))
      .rejects.toThrow('Kit command failed with exit code 1: not found');
  });
});

describe('removeAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should call runCommand with --all', async () => {
    await removeAll();

    expect(mockRunCommand).toHaveBeenCalledWith('remove', ['--all']);
  });

  it('should pass additional flags after --all', async () => {
    mockPrepareArgs.mockReturnValue(['--force']);

    await removeAll({ force: true });

    expect(mockRunCommand).toHaveBeenCalledWith('remove', ['--all', '--force']);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: permission denied'));

    await expect(removeAll())
      .rejects.toThrow('Kit command failed with exit code 1: permission denied');
  });
});
