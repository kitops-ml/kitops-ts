#!/usr/bin/env node
/**
 * Tag and promote a ModelKit across environments.
 *
 * A common release workflow:
 *   1. CI publishes a release candidate to a staging registry.
 *   2. After QA sign-off, the same digest is promoted to production by
 *      re-tagging — no re-packing, no risk of bit-rot between environments.
 *
 * Run: node examples/tag-and-promote.js
 */

import { login, pull, tag, push, inspect, logout } from '../dist/index.js';

const stagingRegistry = process.env.STAGING_REGISTRY ?? 'staging.example.com';
const prodRegistry = process.env.PROD_REGISTRY ?? 'registry.example.com';
const user = process.env.REGISTRY_USER ?? '';
const pass = process.env.REGISTRY_PASS ?? '';

const rcRef = `${stagingRegistry}/org/my-model:rc1`;
const v1Ref = `${prodRegistry}/org/my-model:v1.0.0`;
const latestRef = `${prodRegistry}/org/my-model:latest`;

// --- Inspect the candidate before promoting ---
const metadata = await inspect('org/my-model', 'rc1', { remote: true });
console.log(`Promoting digest: ${metadata.digest}`);
console.log(`Kit version:      ${metadata.cliVersion}`);

// --- Pull the RC so we can tag it locally ---
await login(stagingRegistry, user, pass);
await pull(rcRef);
await logout(stagingRegistry);

// Create two local aliases: a versioned tag and a floating "latest".
await tag(rcRef, v1Ref);
await tag(rcRef, latestRef);
console.log(`Tagged as ${v1Ref} and ${latestRef}`);

// --- Push both tags to production ---
await login(prodRegistry, user, pass);
await push(v1Ref);
await push(latestRef);
await logout(prodRegistry);

console.log('Promotion complete.');
