import { cancellable, parseKeyValueOutput, runCommand } from '../core/exec.js'
import type { VersionResult } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Kit version command
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-version
 */
export function version(): CancellablePromise<VersionResult> {
  return cancellable((signal) => {
    return runCommand('version', [], undefined, { signal }).then((result) => parseKeyValueOutput(result.stdout) as VersionResult)
  })
}
