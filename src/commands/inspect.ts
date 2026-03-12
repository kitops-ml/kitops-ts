import { runCommand, prepareArgs } from "../core/exec.js";
import type { InspectFlags, InspectResult } from "../types/commands.js";

/**
 * Returns the full OCI manifest and parsed Kitfile for a ModelKit.
 *
 * Use `flags.remote` to inspect directly from a registry without pulling first.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-inspect
 */
export async function inspect(path: string, flags?: InspectFlags): Promise<InspectResult> {
  const args = [path];

  if (flags) {
    args.push(...prepareArgs(flags));
  }

  const result = await runCommand('inspect', args);
  return JSON.parse(result.stdout) as InspectResult;
}