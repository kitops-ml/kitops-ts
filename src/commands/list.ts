import { cancellable, parseTableOutput, runCommand } from '../core/exec.js'
import type { ListFlags } from '../types/commands.js'
import type { CancellablePromise, ModelKit } from '../types/kitops.js'

/**
 * Lists ModelKits stored in local cache or a remote repository.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @param repository - Path of a _remote_ repository in the form of `registry/repository`.
 * @see https://kitops.org/docs/cli/cli-path/#kit-list
 */
export function list(repository?: string, flags?: ListFlags): CancellablePromise<ModelKit[] | string> {
  return cancellable((signal) => {
    const format = flags?.format || 'table'
    const args = ['--format', format]
    if (repository) {
      args.push(repository)
    }
    return runCommand('list', args, undefined, { signal }).then((result) => {
      if (format === 'json') {
        return JSON.parse(result.stdout) as ModelKit[]
      }
      if (format === 'table') {
        return parseTableOutput<ModelKit[]>(result.stdout)
      }
      return result.stdout as string
    })
  })
}
