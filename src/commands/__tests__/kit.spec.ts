import { beforeEach,describe, expect, it, vi } from 'vitest'

import { runCommand } from '../../core/exec'
import { kit } from '../kit'

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>()
  return { ...actual, runCommand: vi.fn() }
})

const mockRunCommand = vi.mocked(runCommand)

describe('kit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return a CancellablePromise with a cancel method', () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    const op = kit('version', [])
    expect(op).toBeInstanceOf(Promise)
    expect(typeof op.cancel).toBe('function')
    return op
  })

  it('should forward command and args to runCommand', async () => {
    const expected = { stdout: 'output', stderr: '', exitCode: 0 }
    mockRunCommand.mockResolvedValue(expected)

    const result = await kit('pack', ['.', '--tag', 'my-model:latest'], '')

    expect(mockRunCommand).toHaveBeenCalledWith('pack', ['.', '--tag', 'my-model:latest'], '', { signal: expect.any(AbortSignal) })
    expect(result).toEqual(expected)
  })

  it('should forward options to runCommand', async () => {
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

    await kit('version', [], '', { cwd: '/some/path' })

    expect(mockRunCommand).toHaveBeenCalledWith('version', [], '', { cwd: '/some/path', signal: expect.any(AbortSignal) })
  })

  it('should return the raw ExecResult', async () => {
    const expected = { stdout: 'kit v1.2.3', stderr: '', exitCode: 0 }
    mockRunCommand.mockResolvedValue(expected)

    const result = await kit('version', [], '')

    expect(result).toEqual(expected)
  })

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: error'))

    await expect(kit('pack', [], '')).rejects.toThrow('Kit command failed with exit code 1: error')
  })

  it('should abort the signal when cancel is called', () => {
    let capturedSignal: AbortSignal | undefined

    mockRunCommand.mockImplementation((_cmd, _args, _stdin, opts) => {
      capturedSignal = opts?.signal
      return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    })

    const op = kit('version', [])
    expect(capturedSignal?.aborted).toBe(false)
    op.cancel()
    expect(capturedSignal?.aborted).toBe(true)
  })
})
