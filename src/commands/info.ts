import { parse as parseYaml } from "yaml";
import { runCommand, prepareArgs } from "../core/exec.js";
import type { Kitfile } from "../types/kitfile.js"
import type { InfoFlags } from "../types/commands.js";

/**
 * Returns the parsed Kitfile for a ModelKit.
 *
 * The returned object has a non-enumerable `_raw` property containing the
 * original YAML string, useful if you need to forward it elsewhere without
 * re-serializing:
 * ```ts
 * const kitfile = await info('registry.example.com/org/model:v1');
 * console.log((kitfile as any)._raw); // raw YAML text
 * ```
 *
 * Use `flags.filter` to limit which layers are included in the output.
 *
 * @param path - Full ModelKit reference path in the form of `registry/repository[:tag|@digest]`.
 * @see https://kitops.org/docs/cli/cli-reference/#kit-info
 */
export async function info(path: string, flags?: InfoFlags): Promise<Kitfile> {
  const args = [path]

  if (flags) {
    args.push(...prepareArgs(flags))
  }

  const result = await runCommand('info', args);
  const kitfile = parseYaml(result.stdout) as Kitfile;

  Object.defineProperty(kitfile, '_raw', {
    value: result.stdout,
    enumerable: false,
    writable: false,
  });

  return kitfile;
}