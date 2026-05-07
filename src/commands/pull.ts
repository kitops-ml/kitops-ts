import { prepareArgs, runCommand, cancellable } from "../core/exec.js";
import type { TLSFlags } from "../types/commands.js";
import type { CancellablePromise } from "../types/kitops.js";

/**
 * Pulls a ModelKit from a registry into local storage.
 *
 * After pulling, use `unpack` to extract the contents to disk or
 * `inspect` / `info` to read its metadata without extracting.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the transfer and kill the underlying `kit` process at any time.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @param flags - Optional flags to modify the pull behavior (e.g. TLS settings).
 * @see https://kitops.org/docs/cli/cli-reference/#kit-pull
 *
 * @example
 * ```ts
 * const op = pull('registry.example.com/org/model:v1');
 * setTimeout(() => op.cancel(), 30_000);
 * try {
 *   await op;
 * } catch (e) {
 *   if (e instanceof DOMException && e.name === 'AbortError') {
 *     console.log('Pull was cancelled');
 *   }
 * }
 * ```
 */
export function pull(path: string, flags?: TLSFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = [path, ...(flags ? prepareArgs(flags) : [])];
    return runCommand('pull', args, undefined, { signal }).then(() => {});
  });
}
