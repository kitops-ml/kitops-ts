import { beforeEach,describe, expect, it, vi } from 'vitest'

import { runCommand } from '../../core/exec'
import { tag } from '../tag'

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>()
  return { ...actual, runCommand: vi.fn() }
})

const mockRunCommand = vi.mocked(runCommand)

describe('tag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
  })

  it('should call runCommand with source and destination', async () => {
    await tag('registry.example.com/org/my-model:rc1', 'registry.example.com/org/my-model:v1.0.0')

    expect(mockRunCommand).toHaveBeenCalledWith('tag', [
      'registry.example.com/org/my-model:rc1',
      'registry.example.com/org/my-model:v1.0.0',
    ], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should support local references without a registry', async () => {
    await tag('my-model:dev', 'my-model:stable')

    expect(mockRunCommand).toHaveBeenCalledWith('tag', ['my-model:dev', 'my-model:stable'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: not found'))

    await expect(tag('my-model:v1', 'my-model:v2'))
      .rejects.toThrow('Kit command failed with exit code 1: not found')
  })
})
