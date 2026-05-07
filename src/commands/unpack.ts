import { runCommand, prepareArgs, cancellable } from "../core/exec.js";
import type { UnpackFlags } from "../types/commands.js";
import type { CancellablePromise } from "../types/kitops.js";

/**
 * Extracts a ModelKit with the given flags.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the extraction and kill the underlying `kit` process at any time.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-unpack
 *
 * @example
 * ```ts
 * const op = unpack('registry.example.com/org/model:v1', { dir: './model' });
 * setTimeout(() => op.cancel(), 60_000);
 * try {
 *   await op;
 * } catch (e) {
 *   if (e instanceof DOMException && e.name === 'AbortError') {
 *     console.log('Unpack was cancelled');
 *   }
 * }
 * ```
 */
export function unpack(path: string, flags?: UnpackFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = [path, ...(flags ? prepareArgs(flags) : [])];
    return runCommand('unpack', args, undefined, { signal }).then(() => {});
  });
}
