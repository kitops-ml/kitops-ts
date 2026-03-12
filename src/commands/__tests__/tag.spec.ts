import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tag } from '../tag';
import { runCommand } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);

describe('tag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should call runCommand with source and destination', async () => {
    await tag('registry.example.com/org/my-model:rc1', 'registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith('tag', [
      'registry.example.com/org/my-model:rc1',
      'registry.example.com/org/my-model:v1.0.0',
    ]);
  });

  it('should support local references without a registry', async () => {
    await tag('my-model:dev', 'my-model:stable');

    expect(mockRunCommand).toHaveBeenCalledWith('tag', ['my-model:dev', 'my-model:stable']);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'));

    await expect(tag('my-model:v1', 'my-model:v2'))
      .rejects.toThrow('Kit command failed with exit code 1: not found');
  });
});
