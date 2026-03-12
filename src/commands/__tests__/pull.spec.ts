import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pull } from '../pull';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('pull', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should call runCommand with the reference', async () => {
    await pull('registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith('pull', ['registry.example.com/org/my-model:v1.0.0']);
  });

  it('should forward TLS flags', async () => {
    mockPrepareArgs.mockReturnValue(['--tls-cert=/path/to/cert.pem']);

    await pull('registry.example.com/org/my-model:v1.0.0', { tlsCert: '/path/to/cert.pem' });

    expect(mockRunCommand).toHaveBeenCalledWith('pull', [
      'registry.example.com/org/my-model:v1.0.0',
      '--tls-cert=/path/to/cert.pem',
    ]);
  });

  it('should work without flags', async () => {
    await pull('my-model:latest');

    expect(mockRunCommand).toHaveBeenCalledWith('pull', ['my-model:latest']);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'));

    await expect(pull('registry.example.com/org/my-model:v1.0.0'))
      .rejects.toThrow('Kit command failed with exit code 1: not found');
  });
});
