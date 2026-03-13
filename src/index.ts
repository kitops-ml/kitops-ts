/**
 * kitops-ts — TypeScript/Node.js SDK for the KitOps CLI.
 *
 * Wraps the `kit` binary (https://kitops.org) with a type-safe functional API,
 * making it easy to pack, push, pull, and inspect ModelKits from Node.js scripts
 * or CI pipelines without having to shell out manually.
 *
 * Requirements:
 *   - Node.js 23+
 *   - The `kit` CLI must be installed and reachable on PATH, or set the
 *     KITOPS_CLI_PATH environment variable to the full path of the binary.
 *
 * @example
 * ```ts
 * import { pack, push, login } from 'kitops-ts';
 *
 * await loginUnsafe('registry.example.com', process.env.REGISTRY_USER!, process.env.REGISTRY_PASS!);
 * await pack('.', { tag: 'registry.example.com/org/model:v1' });
 * await push('registry.example.com/org/model:v1');
 * ```
 *
 * @module
 */

export type Layer = 'model' | 'datasets' | 'code' | 'docs' | 'prompts'

export type FilterFlag = `${Layer}${(`:${string}`) | ''}` | `${Layer}${(`:${string}`) | ''},${string}`

// Export all commands
export {
  diff,
  init,
  info,
  inspect,
  kit,
  list,
  login,
  loginUnsafe,
  logout,
  pack,
  pull,
  push,
  remove,
  tag,
  unpack,
  version
} from './commands/index.js';

// Export types
export type {
  Manifest,
  ManifestAnnotations,
  ManifestDescriptor
} from './types/manifest.js'

export type {
  ModelKit,
  ExecResult,
  KitCommand
} from './types/kitops.js';

export type {
  Kitfile,
  Package,
  Model,
  ModelPart,
  Dataset,
  Code,
  Doc,
  Prompt
} from './types/kitfile.js';

export type {
  DiffFlags,
  DiffLayerEntry,
  DiffResult,
  InspectFlags,
  UnpackFlags,
  RemoveFlags,
  PackFlags,
  InitFlags,
  InitResult,
  InspectResult,
  VersionResult
 } from './types/commands.js';
