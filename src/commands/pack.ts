import { cancellable,prepareArgs, runCommand } from '../core/exec.js'
import type { PackFlags } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Packages a ModelKit from a directory that contains a Kitfile.
 *
 * Use `flags.tag` to name the resulting ModelKit so it can be pushed directly.
 * If no tag is provided the kit is stored locally without a named reference.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation and kill the underlying `kit` process at any time.
 *
 * @param directory - Directory containing the Kitfile (defaults to the current directory).
 * @see https://kitops.org/docs/cli/cli-reference/#kit-pack
 *
 * @example
 * ```ts
 * const op = pack('.', { tag: 'registry.example.com/org/model:v1' });
 * setTimeout(() => op.cancel(), 60_000);
 * try {
 *   await op;
 * } catch (e) {
 *   if (e instanceof DOMException && e.name === 'AbortError') {
 *     console.log('Pack was cancelled');
 *   }
 * }
 * ```
 */
export function pack(directory: string = '.', flags?: PackFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = [directory, ...(flags ? prepareArgs(flags) : [])]
    return runCommand('pack', args, undefined, { signal }).then(() => {})
  })

  // @TODO: return pack result (tag, digest) and any other useful info
}
