import { runCommand, prepareArgs } from '../core/exec.js';
import { resolve } from 'path';
import type { InitFlags, InitResult } from '../types/commands.js';

/**
 * Scans `path` for recognizable ML artifacts and generates a Kitfile.
 *
 * The CLI auto-detects files by extension and populates the appropriate layers
 * (model, datasets, code, docs). Pass `flags.force` to overwrite an existing
 * Kitfile without prompting.
 *
 * @param directory - Directory to initialize (defaults to the current directory).
 * @returns Resolved absolute paths to the directory and the generated Kitfile.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-init
 */
export async function init(directory: string = '.', flags?: InitFlags): Promise<InitResult> {
  const args = [directory]

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('init', args);

  const resolvedPath = resolve(directory);

  return {
    path: resolvedPath,
    kitfilePath: resolve(resolvedPath, 'Kitfile')
  }
}