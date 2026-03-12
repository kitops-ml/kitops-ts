import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inspect } from '../inspect';
import { runCommand } from '../../core/exec';
import type { Manifest } from '../../types.d';

vi.mock('../../core/exec');

const mockRunCommand = vi.mocked(runCommand);

const mockManifest: Manifest = {
  digest: 'sha256:1234567890abcdef',
  cliVersion: '1.0.0',
  kitfile: {
    manifestVersion: '2.0',
    package: {
      name: 'test-model',
      description: 'A test model for unit testing',
    },
    model: {
      name: 'test-model',
      path: './model',
      license: 'MIT',
      parts: [
        {
          path: './model/part1.bin',
          digest: 'sha256:part1digest',
          diffId: 'sha256:part1diffid',
        }
      ],
      digest: 'sha256:modeldigest',
      diffId: 'sha256:modeldiffid',
    },
    code: [
      {
        path: './code/main.py',
        digest: 'sha256:codedigest',
        diffId: 'sha256:codediffid',
      }
    ],
    datasets: [
      {
        path: './data/dataset.json',
        digest: 'sha256:datadigest',
        diffId: 'sha256:datadiffid',
      }
    ],
    docs: [
      {
        path: './docs/readme.md',
        description: 'Documentation file',
        digest: 'sha256:docsdigest',
        diffId: 'sha256:docsdiffid',
      }
    ]
  },
  manifest: {
    schemaVersion: 2,
    artifactType: 'application/vnd.kitops.modelkit.v1+json',
    config: {
      mediaType: 'application/vnd.kitops.modelkit.config.v1+json',
      digest: 'sha256:configdigest',
      size: 1024,
    },
    layers: [
      {
        mediaType: 'application/vnd.kitops.modelkit.layer.v1+tar',
        digest: 'sha256:layerdigest',
        size: 2048,
        annotations: {
          'org.opencontainers.image.title': 'model-layer',
        },
      }
    ],
    annotations: {
      'org.opencontainers.image.created': '2024-01-01T00:00:00Z',
    }
  }
}

describe('inspect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call runCommand with correct arguments when modelkit is provided', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: JSON.stringify(mockManifest),
      stderr: '',
      exitCode: 0
    });

    const result = await inspect('my-model');

    expect(mockRunCommand).toHaveBeenCalledWith('inspect', ['my-model']);
    expect(result).toEqual(mockManifest);
  });

  it('should parse JSON response correctly', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: JSON.stringify(mockManifest),
      stderr: '',
      exitCode: 0
    });

    const result = await inspect('complex-model');
    expect(result).toEqual(mockManifest);
  });

  it('should throw error when JSON parsing fails', async () => {
    mockRunCommand.mockResolvedValue({
      stdout: 'invalid json',
      stderr: '',
      exitCode: 0
    });

    await expect(inspect('invalid-model')).rejects.toThrow();
  });
});