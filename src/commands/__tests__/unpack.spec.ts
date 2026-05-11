import { beforeEach,describe, expect, it, vi } from 'vitest'

import { prepareArgs,runCommand } from '../../core/exec'
import { unpack } from '../unpack'

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>()
  return { ...actual, runCommand: vi.fn(), prepareArgs: vi.fn() }
})

const mockRunCommand = vi.mocked(runCommand)
const mockPrepareArgs = vi.mocked(prepareArgs)

describe('unpack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepareArgs.mockReturnValue([])
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
  })

  it('should return a CancellablePromise with a cancel method', () => {
    const op = unpack('./output')
    expect(op).toBeInstanceOf(Promise)
    expect(typeof op.cancel).toBe('function')
    return op
  })

  it('should call runCommand with the destination path and an AbortSignal', async () => {
    await unpack('./output')

    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should forward flags to prepareArgs', async () => {
    mockPrepareArgs.mockReturnValue(['--filter=model'])

    await unpack('./output', { filter: 'model' })

    expect(mockPrepareArgs).toHaveBeenCalledWith({ filter: 'model' })
    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output', '--filter=model'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should support overwrite flag', async () => {
    mockPrepareArgs.mockReturnValue(['--overwrite'])

    await unpack('./output', { overwrite: true })

    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output', '--overwrite'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should support ignoreExisting flag', async () => {
    mockPrepareArgs.mockReturnValue(['--ignore-existing'])

    await unpack('./output', { ignoreExisting: true })

    expect(mockRunCommand).toHaveBeenCalledWith('unpack', ['./output', '--ignore-existing'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should propagate errors from runCommand', async () => {
    mockRunCommand.mockRejectedValue(new Error('Kit command failed with exit code 1: permission denied'))

    await expect(unpack('./output'))
      .rejects.toThrow('Kit command failed with exit code 1: permission denied')
  })

  it('should abort the signal when cancel is called', () => {
    let capturedSignal: AbortSignal | undefined

    mockRunCommand.mockImplementation((_cmd, _args, _stdin, opts) => {
      capturedSignal = opts?.signal
      return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    })

    const op = unpack('./output')
    expect(capturedSignal?.aborted).toBe(false)
    op.cancel()
    expect(capturedSignal?.aborted).toBe(true)
  })
})
