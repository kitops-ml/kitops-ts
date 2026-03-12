import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kit } from '../kit';
import { runCommand } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);

describe('kit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should forward command and args to runCommand', async () => {
    const expected = { stdout: 'output', stderr: '', exitCode: 0 };
    mockRunCommand.mockResolvedValue(expected);

    const result = await kit('pack', ['.', '--tag', 'my-model:latest'], '');

    expect(mockRunCommand).toHaveBeenCalledWith('pack', ['.', '--tag', 'my-model:latest'], '', {});
    expect(result).toEqual(expected);
  });

  it('should forward options to runCommand', async () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

    await kit('version', [], '', { cwd: '/some/path' });

    expect(mockRunCommand).toHaveBeenCalledWith('version', [], '', { cwd: '/some/path' });
  });

  it('should return the raw ExecResult', async () => {
    const expected = { stdout: 'kit v1.2.3', stderr: '', exitCode: 0 };
    mockRunCommand.mockResolvedValue(expected);

    const result = await kit('version', [], '');

    expect(result).toEqual(expected);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: error'));

    await expect(kit('pack', [], '')).rejects.toThrow('Kit command failed with exit code 1: error');
  });
});
