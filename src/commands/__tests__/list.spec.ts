import { describe, it, beforeEach, expect, vi } from 'vitest';
import { list } from '../list';
import { runCommand, parseTableOutput } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);
const mockParseTableOutput = vi.mocked(parseTableOutput);

describe('list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runCommand with correct parameters', async () => {
    mockRunCommand.mockResolvedValue({ stdout: 'test output', stderr: '', exitCode: 0 });
    mockParseTableOutput.mockReturnValue([]);

    await list('test-repo');

    expect(mockRunCommand).toHaveBeenCalledWith('list', ['--format', 'table', 'test-repo']);
  });

  it('should parse table output and return results', async () => {
    const mockOutput = 'test table output';
    const mockParsedData = [
      {
        repository: 'test-repo',
        tag: 'v1.0.0',
        maintainer: 'john@example.com',
        name: 'test-kit',
        size: '100MB',
        digest: 'sha256:abc123'
      }
    ];

    mockRunCommand.mockResolvedValue({ stdout: mockOutput, stderr: '', exitCode: 0 });
    mockParseTableOutput.mockReturnValue(mockParsedData);

    const result = await list('test-repo');

    expect(mockParseTableOutput).toHaveBeenCalledWith(mockOutput);
    expect(result).toEqual(mockParsedData);
  });

  it('should list local kits when no repository is given', async () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    mockParseTableOutput.mockReturnValue([]);

    await list();

    expect(mockRunCommand).toHaveBeenCalledWith('list', ['--format', 'table']);
  });

  it('should propagate errors from runCommand', async () => {
    const error = new Error('Command failed');
    mockRunCommand.mockRejectedValue(error);

    await expect(list('test-repo')).rejects.toThrow('Command failed');
  });
});