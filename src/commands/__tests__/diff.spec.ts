import { describe, it, expect, vi, beforeEach } from 'vitest';
import { diff } from '../diff';
import { runCommand } from '../../core/exec';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);

describe('diff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runCommand with both references', async () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

    await diff('registry.example.com/org/model:v1', 'registry.example.com/org/model:v2');

    expect(mockRunCommand).toHaveBeenCalledWith('diff', [
      'registry.example.com/org/model:v1',
      'registry.example.com/org/model:v2',
    ]);
  });

  it('should return base structure with no differences for empty output', async () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

    const result = await diff('model:v1', 'model:v2');

    expect(result.modelKit1).toBe('model:v1');
    expect(result.modelKit2).toBe('model:v2');
    expect(result.configsDiffer).toBe(false);
    expect(result.annotationsIdentical).toBe(true);
    expect(result.sharedLayers).toEqual([]);
    expect(result.uniqueToKit1).toEqual([]);
    expect(result.uniqueToKit2).toEqual([]);
  });

  it('should parse configs differ section', async () => {
    const output = `Configurations:
Configs differ:
ModelKit1 Config Digest: sha256:abc123
ModelKit2 Config Digest: sha256:def456`;

    mockRunCommand.mockResolvedValue({ stdout: output, stderr: '', exitCode: 0 });

    const result = await diff('model:v1', 'model:v2');

    expect(result.configsDiffer).toBe(true);
    expect(result.config1Digest).toBe('sha256:abc123');
    expect(result.config2Digest).toBe('sha256:def456');
  });

  it('should parse annotations differ', async () => {
    const output = `Annotations:
Annotations differ`;

    mockRunCommand.mockResolvedValue({ stdout: output, stderr: '', exitCode: 0 });

    const result = await diff('model:v1', 'model:v2');

    expect(result.annotationsIdentical).toBe(false);
  });

  it('should parse shared layers', async () => {
    const output = `Shared Layers (2):
---
Type            | Digest         | Size
model           | sha256:abc     | 100MB
datasets        | sha256:def     | 50MB`;

    mockRunCommand.mockResolvedValue({ stdout: output, stderr: '', exitCode: 0 });

    const result = await diff('model:v1', 'model:v2');

    expect(result.sharedLayers).toHaveLength(2);
    expect(result.sharedLayers[0]).toEqual({ type: 'model', digest: 'sha256:abc', size: '100MB' });
    expect(result.sharedLayers[1]).toEqual({ type: 'datasets', digest: 'sha256:def', size: '50MB' });
  });

  it('should parse unique layers for each kit', async () => {
    const output = `Unique Layers to ModelKit1 (1):
---
Type   | Digest      | Size
code   | sha256:111  | 10MB

Unique Layers to ModelKit2 (1):
---
Type    | Digest      | Size
docs    | sha256:222  | 5MB`;

    mockRunCommand.mockResolvedValue({ stdout: output, stderr: '', exitCode: 0 });

    const result = await diff('model:v1', 'model:v2');

    expect(result.uniqueToKit1).toHaveLength(1);
    expect(result.uniqueToKit1[0]).toEqual({ type: 'code', digest: 'sha256:111', size: '10MB' });
    expect(result.uniqueToKit2).toHaveLength(1);
    expect(result.uniqueToKit2[0]).toEqual({ type: 'docs', digest: 'sha256:222', size: '5MB' });
  });

  it('should handle <none> entries in layer sections', async () => {
    const output = `Unique Layers to ModelKit1 (0):
---
<none>`;

    mockRunCommand.mockResolvedValue({ stdout: output, stderr: '', exitCode: 0 });

    const result = await diff('model:v1', 'model:v2');

    expect(result.uniqueToKit1).toEqual([]);
  });

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'));

    await expect(diff('model:v1', 'model:v2'))
      .rejects.toThrow('Kit command failed with exit code 1: not found');
  });
});
