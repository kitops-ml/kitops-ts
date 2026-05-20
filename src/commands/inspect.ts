import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { InspectFlags, InspectResult } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Returns the full OCI manifest and parsed Kitfile for a ModelKit.
 *
 * Use `flags.remote` to inspect directly from a registry without pulling first.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation and kill the underlying `kit` process at any time.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-inspect
 */
export function inspect(path: string, flags?: InspectFlags): CancellablePromise<InspectResult> {
  return cancellable((signal) => {
    const args = [path]
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('inspect', args, undefined, { signal }).then((result) => JSON.parse(result.stdout) as InspectResult)
  })
}
