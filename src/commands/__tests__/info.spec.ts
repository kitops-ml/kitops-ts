import { describe, it, expect, vi, beforeEach } from 'vitest';
import { info } from '../info';
import { runCommand, prepareArgs } from '../../core/exec';

vi.mock('../../core/exec');
vi.mock('yaml', () => ({
  parse: vi.fn((str: string) => JSON.parse(str)),
}));

const mockRunCommand = vi.mocked(runCommand);
const mockPrepareArgs = vi.mocked(prepareArgs);

const mockKitfile = {
  package: { name: 'my-model', version: '1.0.0' },
  model: { path: './model.bin' },
};

describe('info', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrepareArgs.mockReturnValue([]);
  });

  it('should call runCommand with the given path', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: JSON.stringify(mockKitfile),
      stderr: '',
      exitCode: 0,
    });

    await info('registry.example.com/org/my-model:v1.0.0');

    expect(mockRunCommand).toHaveBeenCalledWith('info', ['registry.example.com/org/my-model:v1.0.0']);
  });

  it('should return the parsed Kitfile', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: JSON.stringify(mockKitfile),
      stderr: '',
      exitCode: 0,
    });

    const result = await info('my-model:v1');

    expect(result.package?.name).toBe('my-model');
    expect(result.model?.path).toBe('./model.bin');
  });

  it('should attach a non-enumerable _raw property with the original output', async () => {
    const raw = JSON.stringify(mockKitfile);
    mockRunCommand.mockResolvedValue({ stdout: raw, stderr: '', exitCode: 0 });

    const result = await info('my-model:v1') as any;

    expect(result._raw).toBe(raw);
    expect(Object.keys(result)).not.toContain('_raw');
  });

  it('should forward flags to prepareArgs', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: JSON.stringify(mockKitfile),
      stderr: '',
      exitCode: 0,
    });
    mockPrepareArgs.mockReturnValue(['--remote']);

    await info('my-model:v1', { remote: true });

    expect(mockPrepareArgs).toHaveBeenCalledWith({ remote: true });
    expect(mockRunCommand).toHaveBeenCalledWith('info', ['my-model:v1', '--remote']);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'));

    await expect(info('nonexistent:v1'))
      .rejects.toThrow('Kit command failed with exit code 1: not found');
  });
});
