import { cancellable, runCommand } from '../core/exec.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Assigns an additional tag to an existing ModelKit without re-packing it.
 *
 * Both `source` and `destination` accept the standard `[registry/]repository[:tag]` format.
 * This is a local-only operation; use `push` afterward to publish the new tag.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-tag
 */
export function tag(source: string, destination: string): CancellablePromise<void> {
  return cancellable((signal) => {
    return runCommand('tag', [source, destination], undefined, { signal }).then(() => {})
  })
}
