import { runCommand, parseTableOutput } from "../core/exec.js";
import { ListFlags } from "../types/commands.js";
import type { ModelKit } from "../types/kitops.js";

/**
 * Lists ModelKits stored in local cache or a remote repository.
 *
 * @param repository - Path of a _remote_ repository in the form of `registry/repository`.
 * @see https://kitops.org/docs/cli/cli-path/#kit-list
 */
export async function list(repository?: string, flags?: ListFlags): Promise<ModelKit[] | string> {
  const format = flags?.format || 'table';
  const args = ['--format', format];
  if (repository) {
    args.push(repository)
  }

  const result = await runCommand('list', args);

  if (format === 'json') {
    return JSON.parse(result.stdout) as ModelKit[];
  }

  if (format === 'table') {
    return parseTableOutput<ModelKit[]>(result.stdout);
  }

  return result.stdout as string;
}