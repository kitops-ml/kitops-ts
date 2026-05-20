import { parse as parseYaml } from 'yaml'

import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { InfoFlags } from '../types/commands.js'
import type { Kitfile } from '../types/kitfile.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Returns the parsed Kitfile for a ModelKit.
 *
 * The returned object has a non-enumerable `_raw` property containing the
 * original YAML string, useful if you need to forward it elsewhere without
 * re-serializing:
 * ```ts
 * const kitfile = await info('registry.example.com/org/model:v1');
 * console.log((kitfile as any)._raw); // raw YAML text
 * ```
 *
 * Use `flags.filter` to limit which layers are included in the output.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation and kill the underlying `kit` process at any time.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-info
 */
export function info(path: string, flags?: InfoFlags): CancellablePromise<Kitfile> {
  return cancellable((signal) => {
    const args = [path]
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('info', args, undefined, { signal }).then((result) => {
      const kitfile = parseYaml(result.stdout) as Kitfile
      Object.defineProperty(kitfile, '_raw', {
        value: result.stdout,
        enumerable: false,
        writable: false,
      })
      return kitfile
    })
  })
}
