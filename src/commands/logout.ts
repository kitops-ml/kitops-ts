import { runCommand } from "../core/exec.js";

/**
 * Kit logout command
 * @see https://kitops.org/docs/cli/cli-reference/#kit-logout
 */
export async function logout(registry: string): Promise<void> {
  await runCommand('logout', [registry]);
}