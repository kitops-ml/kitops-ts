#!/usr/bin/env node
/**
 * Package a prompt dataset for LLM fine-tuning and publish it via CI.
 *
 * The `prompts` layer is designed for exactly this use case: versioning prompt
 * templates, instruction sets, and RLHF preference data alongside the model
 * weights and training code they belong to. Storing everything in a single
 * ModelKit keeps the fine-tuning run fully reproducible — you always know
 * which prompts produced which checkpoint.
 *
 * Expected directory layout:
 *
 *   fine-tune/
 *   ├── Kitfile              (generated below if absent)
 *   ├── checkpoints/         model checkpoint directory
 *   ├── prompts/
 *   │   ├── system.txt       system prompt template
 *   │   ├── instructions.jsonl  instruction-following examples
 *   │   └── preferences.jsonl   RLHF preference pairs
 *   ├── data/
 *   │   └── train.jsonl      raw training corpus
 *   └── train.py             training script
 *
 * Run:
 *   MODEL_VERSION=0.2.0 REGISTRY_USER=... REGISTRY_PASS=... node examples/llm-prompts-ci.js
 */

import { writeFile, access } from 'fs/promises';
import { stringify as toYaml } from 'yaml';
import { login, pack, push, logout } from '../dist/index.js';

const registry = process.env.REGISTRY ?? 'registry.example.com';
const user = requireEnv('REGISTRY_USER');
const pass = requireEnv('REGISTRY_PASS');
const version = process.env.MODEL_VERSION ?? 'latest';

const ref = `${registry}/org/llm-finetune:v${version}`;
const workdir = './fine-tune';

// Generate a Kitfile if one isn't already committed.
const kitfilePath = `${workdir}/Kitfile`;
const kitfileExists = await access(kitfilePath).then(() => true).catch(() => false);

if (!kitfileExists) {
  const kitfile = {
    manifestVersion: '1.0.0',
    package: {
      name: 'llm-finetune',
      version,
      description: 'Fine-tuning run with versioned prompt dataset',
      authors: ['AI Team'],
    },
    model: {
      name: 'base-checkpoint',
      path: './checkpoints',
      description: 'Latest training checkpoint',
    },
    // The prompts layer captures everything that shaped the model's behaviour:
    // system prompts, instruction templates, and preference data used in RLHF.
    prompts: [
      {
        path: './prompts/system.txt',
        description: 'System prompt template used during fine-tuning',
      },
      {
        path: './prompts/instructions.jsonl',
        description: 'Instruction-following examples (ShareGPT format)',
      },
      {
        path: './prompts/preferences.jsonl',
        description: 'RLHF preference pairs for DPO training',
      },
    ],
    datasets: [
      {
        name: 'training-corpus',
        path: './data/train.jsonl',
        description: 'Raw pre-training corpus used for continued pre-training',
      },
    ],
    code: [
      { path: './train.py', description: 'Fine-tuning entry point' },
    ],
  };

  await writeFile(kitfilePath, toYaml(kitfile, { lineWidth: 0 }));
  console.log('Kitfile generated.');
}

await login(registry, user, pass);

try {
  await pack(workdir, { tag: ref });
  console.log(`Packed: ${ref}`);

  await push(ref);
  console.log(`Pushed: ${ref}`);
} finally {
  await logout(registry);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}
