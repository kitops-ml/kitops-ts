import { prepareArgs, runCommand } from "../core/exec.js";
import { TLSFlags } from "../types/commands.js";

/**
 * Authenticates with a ModelKit registry.
 *
 * This passes the password via stdin to avoid exposing credentials in the process list (`ps`, `/proc`) or logs,.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-login
 */
export async function login(registry: string, username: string, password: string, flags?: TLSFlags): Promise<void> {
  const args = [registry, '--username', username, '--password-stdin'];

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('login', args, password);
}

/**
 * Authenticates with a ModelKit registry using password as a function argument.
 *
 * The password is passed as a CLI argument, which means it will be visible in the process list on most
 * operating systems and might be visible on logs.
 * Prefer {@link login} in production environments or CI pipelines.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-login
 */
export async function loginUnsafe(registry: string, username: string, password: string, flags?: TLSFlags): Promise<void> {
  const args = [registry, '--username', username, '--password', password];

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  await runCommand('login', args);
}