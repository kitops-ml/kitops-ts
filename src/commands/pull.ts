import { prepareArgs, runCommand } from "../core/exec.js";
import { TLSFlags } from "../types/commands.js";

/**
 * Pulls a ModelKit from a registry into local storage.
 *
 * After pulling, use `unpack` to extract the contents to disk or
 * `inspect` / `info` to read its metadata without extracting.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @param flags - Optional flags to modify the pull behavior (e.g. TLS settings).
 * @see https://kitops.org/docs/cli/cli-reference/#kit-pull
 */
export async function pull(path: string, flags?: TLSFlags): Promise<void> {
  const args = [path];

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('pull', args);
}