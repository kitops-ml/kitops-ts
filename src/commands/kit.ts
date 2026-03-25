import { runCommand } from "../core/exec.js";
import type { KitCommand, ExecResult } from "../types/kitops.js";

/**
 * Low-level escape hatch for running any `kit` subcommand directly.
 *
 * Use this when the higher-level wrappers don't expose a flag or option
 * you need. `options` is forwarded to the underlying spawn call, so you can
 * set `cwd` or custom `env` variables here.
 */
export async function kit(command: KitCommand, args: string[], stdin?: string, options: any = {}): Promise<ExecResult> {
  return runCommand(command, args, stdin, options);
}