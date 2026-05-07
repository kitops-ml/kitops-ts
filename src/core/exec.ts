import { spawn } from 'child_process';
import type { KitCommand, ExecResult, CancellablePromise } from '../types/kitops.js';

type ParsedTableResult = { [key: string]: string }

type StdIO = 'pipe' | 'inherit' | 'ignore'

type ExecOptions = {
  cwd?: string,
  env?: Record<string, string>,
  stdio?: StdIO | StdIO[],
  signal?: AbortSignal,
}

/**
 * Returns the kit CLI binary path.
 * Re-reads KITOPS_CLI_PATH on each call so it can be set dynamically at runtime.
 */
function getKitCli() {
  return process.env.KITOPS_CLI_PATH || 'kit';
}

/**
 * Spawns the kit CLI and runs a single command, returning its captured output.
 *
 * Rejects if the process emits an 'error' event (e.g. binary not found) or
 * exits with a non-zero code. The rejection value is a plain string that
 * includes the exit code and stderr text so callers don't have to reconstruct it.
 *
 * When `options.signal` is provided and aborted, the child process is sent `SIGTERM`
 * and the promise rejects with a `DOMException` named `'AbortError'`. If the signal
 * is already aborted before spawning, the process is never started.
 *
 * @param stdin - Data to write to stdin before closing it (e.g., a password)
 * @param options.cwd - Working directory for the spawned process (default: process.cwd())
 * @param options.env - Extra environment variables merged on top of process.env
 * @param options.stdio - stdio configuration for the spawned process (default: 'pipe' to capture output)
 * @param options.signal - AbortSignal that kills the child process when fired
 */
export function runCommand(command: KitCommand, args: string[] = [], stdin?: string, options: ExecOptions = {}): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(options.signal.reason ?? new DOMException('The operation was aborted', 'AbortError'));
      return;
    }

    const fullArgs = [command, ...args];
    const child = spawn(getKitCli(), fullArgs, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: options.stdio || 'pipe',
    });

    let stdout = '';
    let stderr = '';
    let aborted = false;

    const onAbort = () => {
      aborted = true;
      child.kill('SIGTERM');
    };

    if (options.signal) {
      options.signal.addEventListener('abort', onAbort, { once: true });
    }

    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('error', (error) => {
      reject(`Failed to execute kit command: ${error.message}`);
    });

    child.on('close', (code) => {
      options.signal?.removeEventListener('abort', onAbort);

      if (aborted) {
        reject(options.signal?.reason ?? new DOMException('The operation was aborted', 'AbortError'));
        return;
      }

      const result: ExecResult = {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 0,
      };

      if (code !== 0) {
        reject(`Kit command failed with exit code ${code}: ${stderr}`);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Wraps an async factory in a {@link CancellablePromise}.
 *
 * The library creates and owns the `AbortController` internally — callers never need to
 * set one up. Call `.cancel()` on the returned promise to abort the operation at any time.
 *
 * Falls back gracefully to a no-op `.cancel()` in environments where `AbortController`
 * is unavailable, so the operation still runs to completion safely.
 *
 * @param fn - Factory that receives an optional `AbortSignal` and returns a `Promise<T>`.
 */
export function cancellable<T>(fn: (signal: AbortSignal | undefined) => Promise<T>): CancellablePromise<T> {
  if (typeof AbortController === 'undefined') {
    return Object.assign(fn(undefined), { cancel: () => {} });
  }

  const ac = new AbortController();
  return Object.assign(fn(ac.signal), { cancel: () => ac.abort() });
}

/**
 * Converts a flags object into a flat array of CLI arguments.
 * camelCase keys are converted to kebab-case.
 *
 * Mapping rules:
 *   - `true` => `--key` (presence flag)
 *   - `false` => `--key=false` (explicit opt-out)
 *   - `undefined` | `null` => omitted entirely
 *   - string | number => `--key=value`
 *   - arrays => repeated `--key=value` pairs, one per element
 */
export function prepareArgs(options: Record<string, any>): string[] {
  const args: string[] = [];

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const flag = `--${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;

    if (value === true) {
      args.push(flag);
      return;
    }

    if (value === false) {
      args.push(`${flag}=false`);
      return;
    }

    const values = Array.isArray(value) ? value : [value];
    for (const val of values) {
      if (val !== undefined && val !== null) {
        args.push(`${flag}=${val}`);
      }
    }
  });

  return args;
}

/**
 * Parses the ASCII-table output produced by commands like `kit list` into a
 * typed array of objects.
 *
 * The first line is treated as the header row; subsequent lines are data rows.
 * Columns are delimited by two or more consecutive spaces (the same convention
 * the `kit` CLI uses), and header names are lowercased to form object keys.
 *
 * Returns an empty array for blank output rather than throwing.
 */
export function parseTableOutput<T = ParsedTableResult[]>(output: string): T {
  const lines = output.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [] as T;
  }

  const headers = lines[0].split(/\s{2,}/).map(header => header.toLowerCase().trim());
  const data: ParsedTableResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/\s{2,}/).map(value => value.trim());
    const entry: ParsedTableResult = {};

    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });

    data.push(entry);
  }

  return data as T;
}

/**
 * Parses output in the form of "Key: Value" pairs into an object. Keys are converted to camelCase.
 * Lines that don't match the "Key: Value" format are ignored. Useful for things line `kit version`.
 *
 * Example input:
 * ```
 * Name: MyKit
 * Version: 1.0.0
 * Description: A sample kit
 * ```
 *
 * Output:
 * ```
 * {
 *   name: "MyKit",
 *   version: "1.0.0",
 *   description: "A sample kit"
 * }
 * ```
 */
export function parseKeyValueOutput(output: string): Record<string, string> {
  const lines = output.split('\n');
  const result: any = {};
  for (const line of lines) {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      const camelKey = key.replace(/ (\w)/g, (_, c) => c.toUpperCase());
      result[camelKey] = value;
    }
  }
  return result;
}
