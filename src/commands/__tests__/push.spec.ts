import { describe, it, expect, vi, beforeEach } from 'vitest';
import { push } from '../push';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('push', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should call runCommand with the source reference', async () => {
    await push('registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith('push', ['registry.example.com/org/my-model:v1.0.0']);
  });

  it('should include destination when provided', async () => {
    await push('staging.example.com/my-model:rc1', 'registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith('push', [
      'staging.example.com/my-model:rc1',
      'registry.example.com/org/my-model:v1.0.0',
    ]);
  });

  it('should forward TLS flags', async () => {
    mockPrepareArgs.mockReturnValue(['--tls-verify=false']);

    await push('registry.example.com/org/my-model:v1.0.0', undefined, { tlsVerify: false });

    expect(mockRunCommand).toHaveBeenCalledWith('push', [
      'registry.example.com/org/my-model:v1.0.0',
      '--tls-verify=false',
    ]);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: unauthorized'));

    await expect(push('registry.example.com/org/my-model:v1.0.0'))
      .rejects.toThrow('Kit command failed with exit code 1: unauthorized');
  });
});
