import { describe, it, expect, vi, beforeEach } from 'vitest';
import { version } from '../version';
import { runCommand, parseKeyValueOutput } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockParseKeyValueOutput = vi.mocked(parseKeyValueOutput);

describe('version', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runCommand with the version subcommand', async () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    mockParseKeyValueOutput.mockReturnValue({} as any);

    await version();

    expect(mockRunCommand).toHaveBeenCalledWith('version');
  });

  it('should return parsed version info', async () => {
    const raw = 'Version: 1.2.3\nCommit: abc123\nBuilt: 2024-01-01\nGo Version: go1.21.0';
    const parsed = { version: '1.2.3', commit: 'abc123', built: '2024-01-01', goVersion: 'go1.21.0' };

    mockRunCommand.mockResolvedValue({ stdout: raw, stderr: '', exitCode: 0 });
    mockParseKeyValueOutput.mockReturnValue(parsed);

    const result = await version();

    expect(mockParseKeyValueOutput).toHaveBeenCalledWith(raw);
    expect(result).toEqual(parsed);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Failed to execute kit command: ENOENT'));

    await expect(version()).rejects.toThrow('Failed to execute kit command: ENOENT');
  });
});
