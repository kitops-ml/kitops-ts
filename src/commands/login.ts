import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { TLSFlags } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Authenticates with a ModelKit registry.
 *
 * This passes the password via stdin to avoid exposing credentials in the process list (`ps`, `/proc`) or logs.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-login
 */
export function login(registry: string, username: string, password: string, flags?: TLSFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = [registry, '--username', username, '--password-stdin']
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('login', args, password, { signal }).then(() => {})
  })
}

/**
 * Authenticates with a ModelKit registry using password as a function argument.
 *
 * The password is passed as a CLI argument, which means it will be visible in the process list on most
 * operating systems and might be visible on logs.
 * Prefer {@link login} in production environments or CI pipelines.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-login
 */
export function loginUnsafe(registry: string, username: string, password: string, flags?: TLSFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = [registry, '--username', username, '--password', password]
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('login', args, undefined, { signal }).then(() => {})
  })
}
