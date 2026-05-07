import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pull } from '../pull';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>();
  return { ...actual, runCommand: vi.fn(), prepareArgs: vi.fn() };
});

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

describe('pull', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('should return a CancellablePromise with a cancel method', () => {
    const op = pull('registry.example.com/org/my-model:v1.0.0');
    expect(op).toBeInstanceOf(Promise);
    expect(typeof op.cancel).toBe('function');
    return op;
  });

  it('should call runCommand with the reference and an AbortSignal', async () => {
    await pull('registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith(
      'pull',
      ['registry.example.com/org/my-model:v1.0.0'],
      undefined,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('should forward TLS flags', async () => {
    mockPrepareArgs.mockReturnValue(['--tls-cert=/path/to/cert.pem']);

    await pull('registry.example.com/org/my-model:v1.0.0', { tlsCert: '/path/to/cert.pem' });

    expect(mockRunCommand).toHaveBeenCalledWith(
      'pull',
      ['registry.example.com/org/my-model:v1.0.0', '--tls-cert=/path/to/cert.pem'],
      undefined,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('should work without flags', async () => {
    await pull('my-model:latest');

    expect(mockRunCommand).toHaveBeenCalledWith(
      'pull',
      ['my-model:latest'],
      undefined,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'));

    await expect(pull('registry.example.com/org/my-model:v1.0.0'))
      .rejects.toThrow('Kit command failed with exit code 1: not found');
  });

  it('should abort the signal when cancel is called', () => {
    let capturedSignal: AbortSignal | undefined;

    mockRunCommand.mockImplementation((_cmd, _args, _stdin, opts) => {
      capturedSignal = opts?.signal;
      return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 });
    });

    const op = pull('registry.example.com/org/my-model:v1.0.0');
    expect(capturedSignal?.aborted).toBe(false);
    op.cancel();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
