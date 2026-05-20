import { cancellable, runCommand } from '../core/exec.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Kit logout command
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-logout
 */
export function logout(registry: string): CancellablePromise<void> {
  return cancellable((signal) => {
    return runCommand('logout', [registry], undefined, { signal }).then(() => {})
  })
}
