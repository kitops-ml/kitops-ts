import { runCommand, prepareArgs } from "../core/exec.js";
import type { PackFlags } from "../types/commands.js";

/**
 * Packages a ModelKit from a directory that contains a Kitfile.
 *
 * Use `flags.tag` to name the resulting ModelKit so it can be pushed directly.
 * If no tag is provided the kit is stored locally without a named reference.
 *
 * @param directory - Directory containing the Kitfile (defaults to the current directory).
 * @see https://kitops.org/docs/cli/cli-reference/#kit-pack
 */
export async function pack(directory: string = '.', flags?: PackFlags): Promise<void> {
  const args = [directory]

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('pack', args);

  // @TODO: return pack result (tag, digest) and any other useful info
}