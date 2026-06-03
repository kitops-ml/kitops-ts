import { resolve } from 'path'
import { beforeEach,describe, expect, it, vi } from 'vitest'

import { prepareArgs,runCommand } from '../../core/exec'
import { init } from '../init'

vi.mock('../../core/exec', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/exec')>()
  return { ...actual, runCommand: vi.fn(), prepareArgs: vi.fn() }
})
vi.mock('path')

const mockRunCommand = vi.mocked(runCommand)
const mockPrepareArgs = vi.mocked(prepareArgs)
const mockResolve = vi.mocked(resolve)

describe('init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepareArgs.mockReturnValue([])
    mockResolve.mockImplementation((path: string) => `/resolved/${path}`)
    mockRunCommand.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
  })

  it('should work with no arguments', async () => {
    await init()

    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should call runCommand with default path and prepared args', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false }
    mockPrepareArgs.mockReturnValue(['--name', 'test', '--desc', 'description'])

    await init('.', flags)

    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.', '--name', 'test', '--desc', 'description'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should call runCommand with custom path', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false }
    const customPath = '/custom/path'

    await init(customPath, flags)

    expect(mockRunCommand).toHaveBeenCalledWith('init', [customPath], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should return resolved paths', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false }
    mockResolve.mockReturnValueOnce('/resolved/path').mockReturnValueOnce('/resolved/path/Kitfile')

    const result = await init('./test', flags)

    expect(result).toEqual({
      path: '/resolved/path',
      kitfilePath: '/resolved/path/Kitfile',
    })
    expect(mockResolve).toHaveBeenCalledWith('./test')
    expect(mockResolve).toHaveBeenCalledWith('/resolved/path', 'Kitfile')
  })

  it('should handle force flag', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: true }
    mockPrepareArgs.mockReturnValue(['--force'])

    await init('.', flags)

    expect(mockPrepareArgs).toHaveBeenCalledWith(flags)
    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.', '--force'], undefined, { signal: expect.any(AbortSignal) })
  })

  it('should use default path when not provided', async () => {
    const flags = { name: 'test', desc: 'description', author: 'author', force: false }

    await init(undefined as any, flags)

    expect(mockRunCommand).toHaveBeenCalledWith('init', ['.'], undefined, { signal: expect.any(AbortSignal) })
  })
})
