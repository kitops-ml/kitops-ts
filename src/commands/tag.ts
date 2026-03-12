import { runCommand } from "../core/exec.js";

/**
 * Assigns an additional tag to an existing ModelKit without re-packing it.
 *
 * Both `source` and `destination` accept the standard `[registry/]repository[:tag]` format.
 * This is a local-only operation; use `push` afterward to publish the new tag.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-tag
 */
export async function tag(source: string, destination: string): Promise<void> {
  const args = [source, destination];
  await runCommand('tag', args);
}