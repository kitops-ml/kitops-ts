import { runCommand, parseKeyValueOutput } from "../core/exec.js";
import type { VersionResult } from "../types/commands.js";

/**
 * Kit version command
 * @see https://kitops.org/docs/cli/cli-reference/#kit-version
 */
export async function version(): Promise<VersionResult> {
  const result = await runCommand('version');
  return parseKeyValueOutput(result.stdout) as VersionResult;
}