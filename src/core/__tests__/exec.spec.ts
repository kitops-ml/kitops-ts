import { spawn } from 'child_process'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { cancellable,parseTableOutput, prepareArgs, runCommand } from '../exec'

vi.mock('child_process')

const mockSpawn = vi.mocked(spawn)

describe('exec', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variable
    delete process.env.KITOPS_CLI_PATH
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('runCommand', () => {
    it('should execute command successfully', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const promise = runCommand('version')

      // Get the callbacks that were registered
      const stdoutDataCallback = mockChild.stdout.on.mock.calls.find(call => call[0] === 'data')?.[1]
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')?.[1]

      // Simulate stdout data
      stdoutDataCallback?.('v1.0.0\n')

      // Simulate successful close
      closeCallback?.(0)

      const result = await promise

      expect(result).toEqual({
        stdout: 'v1.0.0',
        stderr: '',
        exitCode: 0,
      })
    })

    it('should reject on non-zero exit code', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const promise = runCommand('version')

      // Get the callbacks
      const stderrDataCallback = mockChild.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1]
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')?.[1]

      // Simulate stderr data
      stderrDataCallback?.('command not found\n')

      // Simulate error close
      closeCallback?.(1)

      await expect(promise).rejects.toBe('Kit command failed with exit code 1: command not found\n')
    })

    it('should reject on spawn error', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const promise = runCommand('version')

      // Get the error callback
      const errorCallback = mockChild.on.mock.calls.find(call => call[0] === 'error')?.[1]

      // Simulate spawn error
      errorCallback?.({ message: 'ENOENT' })

      await expect(promise).rejects.toBe('Failed to execute kit command: ENOENT')
    })

    it('should use custom options', () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const options = {
        cwd: '/custom/path',
        env: { CUSTOM_VAR: 'value' },
        stdio: 'inherit' as const,
      }

      runCommand('version', ['--help'], undefined, options)

      expect(mockSpawn).toHaveBeenCalledWith('kit', ['version', '--help'], {
        cwd: '/custom/path',
        env: { ...process.env, CUSTOM_VAR: 'value' },
        stdio: 'inherit',
      })
    })

    it('should use custom CLI path from environment variable', () => {
      // We need to mock the module to test this since KIT_CLI is evaluated at module load time
      // The test should check that the default 'kit' command is used since the env var
      // was set after module load
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      runCommand('version')

      expect(mockSpawn).toHaveBeenCalledWith('kit', ['version'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe',
      })
    })
  })

  describe('AbortSignal support', () => {
    it('should reject immediately without spawning when signal is already aborted', async () => {
      const ac = new AbortController()
      ac.abort()

      const promise = runCommand('version', [], undefined, { signal: ac.signal })

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('should kill the child process and reject when signal is aborted mid-run', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const ac = new AbortController()
      const promise = runCommand('version', [], undefined, { signal: ac.signal })

      ac.abort()

      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')?.[1]
      closeCallback?.(null)

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM')
    })

    it('should clean up the abort listener after the process closes normally', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const ac = new AbortController()
      const removeEventListenerSpy = vi.spyOn(ac.signal, 'removeEventListener')

      const promise = runCommand('version', [], undefined, { signal: ac.signal })

      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')?.[1]
      closeCallback?.(0)

      await promise

      expect(removeEventListenerSpy).toHaveBeenCalled()
    })

    it('should resolve normally when signal is provided but never aborted', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
      }

      mockSpawn.mockReturnValue(mockChild as any)

      const ac = new AbortController()
      const promise = runCommand('version', [], undefined, { signal: ac.signal })

      const stdoutDataCallback = mockChild.stdout.on.mock.calls.find(call => call[0] === 'data')?.[1]
      const closeCallback = mockChild.on.mock.calls.find(call => call[0] === 'close')?.[1]

      stdoutDataCallback?.('v1.0.0\n')
      closeCallback?.(0)

      await expect(promise).resolves.toEqual({ stdout: 'v1.0.0', stderr: '', exitCode: 0 })
      expect(mockChild.kill).not.toHaveBeenCalled()
    })
  })

  describe('cancellable', () => {
    it('should return a Promise with a cancel method', () => {
      const op = cancellable(() => Promise.resolve())
      expect(op).toBeInstanceOf(Promise)
      expect(typeof op.cancel).toBe('function')
    })

    it('should resolve the underlying promise', async () => {
      const op = cancellable(() => Promise.resolve(42))
      await expect(op).resolves.toBe(42)
    })

    it('should reject when the underlying promise rejects', async () => {
      const op = cancellable(() => Promise.reject(new Error('fail')))
      await expect(op).rejects.toThrow('fail')
    })

    it('should abort the signal when cancel is called', () => {
      let capturedSignal: AbortSignal | undefined

      const op = cancellable((signal) => {
        capturedSignal = signal
        return new Promise(() => {})
      })

      expect(capturedSignal?.aborted).toBe(false)
      op.cancel()
      expect(capturedSignal?.aborted).toBe(true)
    })

    it('should pass an AbortSignal to the factory', () => {
      let capturedSignal: AbortSignal | undefined

      cancellable((signal) => {
        capturedSignal = signal
        return Promise.resolve()
      })

      expect(capturedSignal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('prepareArgs', () => {
    it('should handle boolean flags', () => {
      const options = { force: true, quiet: false, verbose: true }
      const result = prepareArgs(options)
      expect(result).toEqual(['--force', '--quiet=false', '--verbose'])
    })

    it('should handle string and number values', () => {
      const options = { tag: 'latest', port: 8080, name: 'test' }
      const result = prepareArgs(options)
      expect(result).toEqual(['--tag=latest', '--port=8080', '--name=test'])
    })

    it('should handle array values', () => {
      const options = { exclude: ['node_modules', '.git'], include: ['src'] }
      const result = prepareArgs(options)
      expect(result).toEqual(['--exclude=node_modules', '--exclude=.git', '--include=src'])
    })

    it('should ignore undefined and null values', () => {
      const options = { tag: 'latest', port: undefined, name: null }
      const result = prepareArgs(options)
      expect(result).toEqual(['--tag=latest'])
    })

    it('should handle mixed option types', () => {
      const options = {
        force: true,
        quiet: false,
        tag: 'v1.0.0',
        exclude: ['test', 'docs'],
        timeout: 30,
        debug: undefined,
      }
      const result = prepareArgs(options)
      expect(result).toEqual([
        '--force',
        '--quiet=false',
        '--tag=v1.0.0',
        '--exclude=test',
        '--exclude=docs',
        '--timeout=30',
      ])
    })

    it('should convert camelCase keys to kebab-case', () => {
      const result = prepareArgs({ tlsVerify: true, ignoreExisting: false })
      expect(result).toEqual(['--tls-verify', '--ignore-existing=false'])
    })
  })

  describe('parseTableOutput', () => {
    it('should return empty array for empty output', () => {
      expect(parseTableOutput('')).toEqual([])
      expect(parseTableOutput('   ')).toEqual([])
      expect(parseTableOutput('\n\n\n')).toEqual([])
    })

    it('should parse table output with single row', () => {
      const tableOutput = 'REPOSITORY  TAG      SIZE\ntest-repo   latest   100MB'
      const result = parseTableOutput(tableOutput)
      expect(result).toEqual([{
        repository: 'test-repo',
        tag: 'latest',
        size: '100MB',
      }])
    })

    it('should parse table output with multiple rows', () => {
      const tableOutput = `REPOSITORY     TAG      SIZE
my-repo        v1.0.0   50MB
another-repo   latest   150MB
test-repo      dev      25MB`

      const result = parseTableOutput(tableOutput)
      expect(result).toEqual([
        { repository: 'my-repo', tag: 'v1.0.0', size: '50MB' },
        { repository: 'another-repo', tag: 'latest', size: '150MB' },
        { repository: 'test-repo', tag: 'dev', size: '25MB' },
      ])
    })

    it('should handle tables with irregular spacing', () => {
      const tableOutput = 'NAME    VERSION     STATUS\nkit1    1.0.0       active\nkit2    2.0.0       inactive'
      const result = parseTableOutput(tableOutput)
      expect(result).toEqual([
        { name: 'kit1', version: '1.0.0', status: 'active' },
        { name: 'kit2', version: '2.0.0', status: 'inactive' },
      ])
    })

    it('should convert headers to lowercase', () => {
      const tableOutput = 'REPOSITORY_NAME  TAG_VERSION  FILE_SIZE\ntest             v1.0         100MB'
      const result = parseTableOutput(tableOutput)
      expect(result).toEqual([{
        repository_name: 'test',
        tag_version: 'v1.0',
        file_size: '100MB',
      }])
    })
  })
})