import { runCommand, prepareArgs } from "../core/exec.js";
import type { UnpackFlags } from "../types/commands.js";

/**
 * Extracts a ModelKit with the given flags
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-unpack
 */
export async function unpack(path: string, flags?: UnpackFlags): Promise<void> {
  const args = [path]

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('unpack', args);
}