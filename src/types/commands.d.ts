import type { Kitfile } from "./kitfile.js";
import type { Manifest } from "./manifest.js";
import type { FilterFlag } from "./kitops.js";

/**
 * Types for the various flags and results used by the KitOps CLI commands.
 *
 * Instead of one file per command, we are defining all here because some are similar, others are just 1 or 2 types max,
 * so keeping it simple is easier to maintain. If this grows, we can always extract into separate files.
 *
 * For info on the flags available for each command, see the KitOps CLI reference: https://kitops.org/docs/cli/cli-reference/
 * @see https://kitops.org/docs/cli/cli-reference/
 */

export type InspectFlags = {
  remote?: boolean;
}

export type InfoFlags = {
  remote?: boolean,
  filter?: FilterFlag
}

export type UnpackFlags = {
  dir?: string,
  overwrite?: boolean,
  ignoreExisting?: boolean,
  filter?: FilterFlag
}

export type RemoveFlags = {
  force?: boolean,
  all?: boolean,
  remote?: boolean
}

export type PackFlags = {
  file?: string,
  tag?: string,
  compression?: string,
  useModelPack?: boolean
}

export type InitFlags = {
  name?: string,
  desc?: string,
  author?: string,
  force?: boolean,
}

export type InitResult = {
  path: string,
  kitfilePath: string,
}

export type InspectResult = {
  digest: string,
  cliVersion: string,
  kitfile: Kitfile,
  manifest: Manifest
};

export type ListFlags = {
  format: 'table' | 'json' | 'template',
}

// These flags are used by multiple commands that interact with registries, so we define them in a shared type that we can extend if needed.
export type TLSFlags = {
  tlsVerify?: boolean,
  tlsCert?: string,
}

export type VersionResult = {
  version: string;
  commit: string;
  built: string;
  goVersion: string;
}

export type DiffFlags = {
  plainHttp?: boolean;
}

export type DiffLayerEntry = {
  type: string;
  digest: string;
  size: string;
}

export type DiffResult = {
  modelKit1: string;
  modelKit2: string;
  configsDiffer: boolean;
  config1Digest?: string;
  config2Digest?: string;
  annotationsIdentical: boolean;
  sharedLayers: DiffLayerEntry[];
  uniqueToKit1: DiffLayerEntry[];
  uniqueToKit2: DiffLayerEntry[];
}
