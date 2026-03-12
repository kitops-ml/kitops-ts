#!/usr/bin/env node
/**
 * Build a Kitfile programmatically and pack it.
 *
 * Useful when you want to generate the Kitfile from existing metadata (e.g. a
 * training config, a model card, or package.json) rather than maintaining it
 * as a static file in version control.
 *
 * This example includes a local `buildKitfile` helper that serializes a config
 * object to YAML. You can copy it into your own project as-is — it only needs
 * the `yaml` package, which is already a dependency of kitops-ts.
 *
 * Run: node examples/build-kitfile.js
 */

import { writeFile } from 'fs/promises';
import { stringify as toYaml } from 'yaml';
import { pack } from '../dist/index.js';

/**
 * Serializes a Kitfile config to a YAML string ready to be written to disk.
 * `manifestVersion` defaults to '1.0.0' when not provided.
 *
 * @param {object} config - A Kitfile-shaped object (see Kitfile type in the library).
 * @returns {string} YAML string.
 */
function buildKitfile({ manifestVersion = '1.0.0', ...rest }) {
  return toYaml({ manifestVersion, ...rest }, { lineWidth: 0 });
}

// ---

const registry = process.env.REGISTRY ?? 'registry.example.com';
const version = process.env.MODEL_VERSION ?? '1.0.0';
const tag = `${registry}/org/sentiment-model:v${version}`;

const yaml = buildKitfile({
  package: {
    name: 'sentiment-model',
    version,
    description: 'Fine-tuned sentiment classification model',
    authors: ['ML Team'],
    license: 'Apache-2.0',
  },
  model: {
    name: 'sentiment-classifier',
    path: './model/weights.pt',
    format: 'pytorch',
    parameters: {
      architecture: 'bert-base',
      layers: 12,
      hiddenSize: 768,
    },
  },
  datasets: [
    {
      name: 'training-set',
      path: './data/train.csv',
      description: 'Labeled training examples (80/20 split)',
      license: 'CC-BY-4.0',
    },
    {
      name: 'validation-set',
      path: './data/val.csv',
      description: 'Held-out validation set',
      license: 'CC-BY-4.0',
    },
  ],
  code: [
    { path: './src/train.py', description: 'Training entry point' },
    { path: './src/infer.py', description: 'Inference entry point' },
  ],
  docs: [
    { path: './README.md', description: 'Model card' },
  ],
});

await writeFile('./Kitfile', yaml);
console.log('Kitfile written.');

await pack('.', { tag });
console.log(`Packed: ${tag}`);
