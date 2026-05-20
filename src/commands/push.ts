import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { TLSFlags } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Pushes a ModelKit to a registry.
 *
 * Supply `destination` to push under a different reference than `source`,
 * e.g. to promote from a staging registry to production without re-packing.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the upload and kill the underlying `kit` process at any time.
 *
 * @param source - Local or remote reference of the ModelKit to push.
 * @param destination - Target reference in the registry. Defaults to `source`.
 * @param flags - Optional flags to modify the push behavior (e.g. TLS settings).
 * @see https://kitops.org/docs/cli/cli-reference/#kit-push
 */
export function push(source: string, destination?: string, flags?: TLSFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = destination ? [source, destination] : [source]
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('push', args, undefined, { signal }).then(() => {})
  })
}
