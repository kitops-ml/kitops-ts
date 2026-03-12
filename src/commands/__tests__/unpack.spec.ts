import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unpack } from '../unpack';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('unpack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should call runCommand with the destination path', async () => {
    await unpack('./output');

    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output']);
  });

  it('should forward flags to prepareArgs', async () => {
    mockPrepareArgs.mockReturnValue(['--filter=model']);

    await unpack('./output', { filter: 'model' });

    expect(mockPrepareArgs).toHaveBeenCalledWith({ filter: 'model' });
    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output', '--filter=model']);
  });

  it('should support overwrite flag', async () => {
    mockPrepareArgs.mockReturnValue(['--overwrite']);

    await unpack('./output', { overwrite: true });

    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output', '--overwrite']);
  });

  it('should support ignoreExisting flag', async () => {
    mockPrepareArgs.mockReturnValue(['--ignore-existing']);

    await unpack('./output', { ignoreExisting: true });

    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output', '--ignore-existing']);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: permission denied'));

    await expect(unpack('./output'))
      .rejects.toThrow('Kit command failed with exit code 1: permission denied');
  });
});
