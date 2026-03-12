#!/usr/bin/env node
/**
 * CI/CD pipeline — pack and publish a ModelKit.
 *
 * Reads credentials and version metadata from environment variables so nothing
 * sensitive ends up in the script or the process list.
 *
 * Typical usage in GitHub Actions:
 *
 *   - name: Publish ModelKit
 *     run: node examples/ci-cd.js
 *     env:
 *       REGISTRY: ghcr.io
 *       REGISTRY_USER: ${{ github.actor }}
 *       REGISTRY_PASS: ${{ secrets.GITHUB_TOKEN }}
 *       MODEL_VERSION: ${{ github.ref_name }}
 *
 * Run locally: REGISTRY=... REGISTRY_USER=... REGISTRY_PASS=... node examples/ci-cd.js
 */

import { login, pack, push, logout } from '../dist/index.js';

const registry = requireEnv('REGISTRY');
const user = requireEnv('REGISTRY_USER');
const pass = requireEnv('REGISTRY_PASS');
const version = process.env.MODEL_VERSION ?? 'latest';

const ref = `${registry}/org/my-model:${version}`;

await login(registry, user, pass);
console.log(`Logged in to ${registry}`);

try {
  await pack('.', { tag: ref });
  console.log(`Packed: ${ref}`);

  await push(ref);
  console.log(`Pushed: ${ref}`);
} finally {
  // Always log out so credentials aren't cached on shared runners.
  await logout(registry);
  console.log('Logged out.');
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}
