/** Arbitrary string key/value pairs attached to an OCI descriptor or manifest. */
export type ManifestAnnotations = {
  [key: string]: string
}

/**
 * OCI content descriptor — identifies a blob by media type, digest, and size.
 * @see https://github.com/opencontainers/image-spec/blob/6a983fd8be10f63063ce6452be099cd6e20fb36b/descriptor.md
 */
export type ManifestDescriptor = {
  mediaType: string,
  digest: string,
  size: number,
  urls?: string[],
  annotations?: ManifestAnnotations,
  data?: string,
  artifactType?: string
}

/**
 * OCI Image Manifest — the top-level document stored in a registry for each tag.
 * `config` holds the Kitfile descriptor; `layers` holds one descriptor per
 * content layer (model, datasets, code, docs, prompts).
 * @see https://github.com/opencontainers/image-spec/blob/6a983fd8be10f63063ce6452be099cd6e20fb36b/manifest.md
 */
interface OCIManifest {
  schemaVersion: number,
  mediaType: string,
  artifactType?: string,
  config: ManifestDescriptor,
  layers: ManifestDescriptor[]
  annotations: ManifestAnnotations
}

export interface Manifest extends OCIManifest {}
