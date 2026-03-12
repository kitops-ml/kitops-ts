import { prepareArgs, runCommand } from "../core/exec.js";
import type { RemoveFlags } from "../types/commands.js";

/**
 * Removes a ModelKit with the given path from local storage or a remote registry.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-remove
 */
export async function remove(path: string, flags?: RemoveFlags): Promise<void> {
  const args: string[] = flags?.all ? [] : [path];

  if (flags) {
    args.push(...prepareArgs(flags));
  }
  await runCommand('remove', args);
}

/**
 * Removes all locally cached ModelKits. Equivalent to `remove('', { all: true })` but
 * avoids passing a dummy path argument.
 */
export async function removeAll(flags?: Omit<RemoveFlags, 'all'>): Promise<void> {
  const args = ['--all'];
  if (flags) {
    args.push(...prepareArgs(flags));
  }
  await runCommand('remove', args);
}