import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { RemoveFlags } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Removes a ModelKit with the given path from local storage or a remote registry.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-remove
 */
export function remove(path: string, flags?: RemoveFlags): CancellablePromise<void> {
  return cancellable((signal) => {
    const args: string[] = flags?.all ? [] : [path]
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('remove', args, undefined, { signal }).then(() => {})
  })
}

/**
 * Removes all locally cached ModelKits. Equivalent to `remove('', { all: true })` but
 * avoids passing a dummy path argument.
 *
 * To remove all kits from a remote registry, use `remove('', { all: true, remote: true })`
 * instead.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 */
export function removeAll(flags?: Omit<RemoveFlags, 'all' | 'remote'>): CancellablePromise<void> {
  return cancellable((signal) => {
    const args = ['--all']
    if (flags) {
      args.push(...prepareArgs(flags))
    }
    return runCommand('remove', args, undefined, { signal }).then(() => {})
  })
}
