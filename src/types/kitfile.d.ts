import { Layer } from "./kitops.js";

export type Package = {
  name?: string,
  authors?: string[],
  version?: string,
  license?: string;
  description?: string
}

/**
 * OCI layer identity fields populated after a pack or inspect operation.
 * These are read-only from the registry; you don't set them when authoring a Kitfile.
 */
interface LayerInfo {
  digest?: string;
  diffId?: string;
}

interface ModelPart {
  path?: string,
  type?: string,
  license?: string;
}

export interface Model {
  name?: string,
  path?: string,
  parts?: ModelPart[],
  license?: string,
  description?: string,
  format?: string,
  parameters?: Record<string, string | number>
}

export interface Dataset {
  name?: string,
  path?: string,
  description?: string;
  license?: string;
  parameters?: unknown;
}

export interface Code {
  path: string,
  description: string
}

export interface Doc {
  path: string,
  description: string
}

export interface Prompt {
  path?: string;
  description?: string;
}

// Internal types for the kitfile definition, which include the OCI layer info fields
interface KitfileModelPart extends ModelPart, LayerInfo { }
interface KitfileModel extends Model, LayerInfo { }
interface KitfileDataset extends Dataset, LayerInfo { }
interface KitfileCode extends Code, LayerInfo { }
interface KitfileDoc extends Doc, LayerInfo { }
interface KitfilePrompt extends Prompt, LayerInfo { }

/**
 * Typed representation of a Kitfile.
 * @see https://kitops.org/docs/kitfile/kf-overview/
 *
 * Mirrors the Go struct at:
 * https://github.com/kitops-ml/kitops/blob/main/pkg/artifact/kitfile.go
 *
 * When returned by `info()`, the object also carries a non-enumerable `_raw` string property with the original YAML string.
 */
export type Kitfile = {
  manifestVersion: string;
  package?: Package;
  model?: KitfileModel;
  code?: KitfileCode[];
  datasets?: KitfileDataset[];
  docs?: KitfileDoc[];
  prompts?: KitfilePrompt[];
}
