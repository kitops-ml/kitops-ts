import { resolve } from 'path'

import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { InitFlags, InitResult } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Scans `path` for recognizable ML artifacts and generates a Kitfile.
 *
 * The CLI auto-detects files by extension and populates the appropriate layers
 * (model, datasets, code, docs). Pass `flags.force` to overwrite an existing
 * Kitfile without prompting.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation and kill the underlying `kit` process at any time.
 *
 * @param directory - Directory to initialize (defaults to the current directory).
 * @returns Resolved absolute paths to the directory and the generated Kitfile.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-init
 */
export function init(directory: string = '.', flags?: InitFlags): CancellablePromise<InitResult> {
  return cancellable((signal) => {
    const args = [directory]
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('init', args, undefined, { signal }).then(() => {
      const resolvedPath = resolve(directory)
      return {
        path: resolvedPath,
        kitfilePath: resolve(resolvedPath, 'Kitfile'),
      }
    })
  })
}
