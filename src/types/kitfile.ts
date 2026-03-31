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
interface LayerIdentity {
  digest?: string;
  diffId?: string;
}

// Base interface for all layer types, which includes the common `path` and optional `description` fields.
export interface LayerCommons {
  path: string;
  description?: string;
}

export interface ModelPart {
  name?: string,
  path?: string,
  type?: string
}

export interface Model extends LayerCommons {
  name?: string,
  framework?: string;
  version?: string;
  license?: string,
  parts?: ModelPart[],
  parameters?: unknown;
}

export interface Dataset extends LayerCommons {
  name?: string,
  license?: string;
  parameters?: unknown;
}

export interface Code extends LayerCommons {
  license?: string;
}

export interface Doc extends LayerCommons {}

export interface Prompt extends LayerCommons {}

// Internal types for the kitfile definition, which include the OCI layer info fields
interface KitfileModelPart extends ModelPart, LayerIdentity { }
interface KitfileModel extends Model, LayerIdentity {
  parts?: KitfileModelPart[];
}
interface KitfileDataset extends Dataset, LayerIdentity { }
interface KitfileCode extends Code, LayerIdentity { }
interface KitfileDoc extends Doc, LayerIdentity { }
interface KitfilePrompt extends Prompt, LayerIdentity { }

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
