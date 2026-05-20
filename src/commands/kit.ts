import { cancellable, runCommand } from '../core/exec.js'
import type { CancellablePromise, ExecResult, KitCommand } from '../types/kitops.js'

/**
 * Low-level escape hatch for running any `kit` subcommand directly.
 *
 * Use this when the higher-level wrappers don't expose a flag or option
 * you need. `options` is forwarded to the underlying spawn call, so you can
 * set `cwd` or custom `env` variables here.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation and kill the underlying `kit` process at any time.
 */
export function kit(command: KitCommand, args: string[], stdin?: string, options: any = {}): CancellablePromise<ExecResult> {
  return cancellable((signal) => {
    return runCommand(command, args, stdin, { ...options, signal })
  })
}
