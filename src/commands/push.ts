import { prepareArgs, runCommand } from "../core/exec.js";
import { TLSFlags } from "../types/commands.js";

/**
 * Pushes a ModelKit to a registry.
 *
 * Supply `destination` to push under a different reference than `source`,
 * e.g. to promote from a staging registry to production without re-packing.
 *
 * @param source - Local or remote reference of the ModelKit to push.
 * @param destination - Target reference in the registry. Defaults to `source`.
 * @param flags - Optional flags to modify the push behavior (e.g. TLS settings).
 * @see https://kitops.org/docs/cli/cli-reference/#kit-push
 */
export async function push(source: string, destination?: string, flags?: TLSFlags): Promise<void> {
  const args = destination ? [source, destination] : [source];

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('push', args);
}