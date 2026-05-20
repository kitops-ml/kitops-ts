import { beforeEach,describe, expect, it, vi } from 'vitest'

import { prepareArgs,runCommand } from '../../core/exec'
import { push } from '../push'

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>()
  return { ...actual, runCommand: vi.fn(), prepareArgs: vi.fn() }
})

const mockRunCommand = vi.mocked(runCommand)
const mockPrepareArgs = vi.mocked(prepareArgs)

describe('push', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepareArgs.mockReturnValue([])
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
  })

  it('should return a CancellablePromise with a cancel method', () => {
    const op = push('registry.example.com/org/my-model:v1.0.0')
    expect(op).toBeInstanceOf(Promise)
    expect(typeof op.cancel).toBe('function')
    return op
  })

  it('should call runCommand with the source reference', async () => {
    await push('registry.example.com/org/my-model:v1.0.0')

    expect(mockRunCommand).toHaveBeenCalledWith('push', ['registry.example.com/org/my-model:v1.0.0'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should include destination when provided', async () => {
    await push('staging.example.com/my-model:rc1', 'registry.example.com/org/my-model:v1.0.0')

    expect(mockRunCommand).toHaveBeenCalledWith('push', [
      'staging.example.com/my-model:rc1',
      'registry.example.com/org/my-model:v1.0.0',
    ], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should forward TLS flags', async () => {
    mockPrepareArgs.mockReturnValue(['--tls-verify=false'])

    await push('registry.example.com/org/my-model:v1.0.0', undefined, { tlsVerify: false })

    expect(mockRunCommand).toHaveBeenCalledWith('push', [
      'registry.example.com/org/my-model:v1.0.0',
      '--tls-verify=false',
    ], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: unauthorized'))

    await expect(push('registry.example.com/org/my-model:v1.0.0'))
      .rejects.toThrow('Kit command failed with exit code 1: unauthorized')
  })

  it('should abort the signal when cancel is called', () => {
    let capturedSignal: AbortSignal | undefined

    mockRunCommand.mockImplementation((_cmd, _args, _stdin, opts) => {
      capturedSignal = opts?.signal
      return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    })

    const op = push('registry.example.com/org/my-model:v1.0.0')
    expect(capturedSignal?.aborted).toBe(false)
    op.cancel()
    expect(capturedSignal?.aborted).toBe(true)
  })
})
