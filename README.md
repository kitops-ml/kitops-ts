# kitops-ts

TypeScript/Node.js SDK for the [KitOps](https://kitops.org) CLI. Provides a type-safe functional API for packing, pushing, pulling, and inspecting ModelKits — without having to shell out manually.

Similar to [pykitops](https://github.com/jozu-ai/kitops/tree/main/pykitops) but for TypeScript/JavaScript.

## Requirements

- Node.js >= 23
- [KitOps CLI](https://kitops.org/docs/installation) installed and available in `PATH`
  (or set `KITOPS_CLI_PATH` to the full path of the binary)

## Installation

```bash
npm install kitops-ts
# or
pnpm add kitops-ts
```

## Quick start

```typescript
import { login, pack, push } from 'kitops-ts';

await login('registry.example.com', process.env.REGISTRY_USER!, process.env.REGISTRY_PASS!);
await pack('.', { tag: 'registry.example.com/org/my-model:v1.0.0' });
await push('registry.example.com/org/my-model:v1.0.0');
```

## API

### `init(path?, flags?)`

Scans a directory for ML artifacts and generates a Kitfile. Automatically detects models, datasets, code, and docs by file extension.

```typescript
const result = await init('./my-model', {
  name: 'my-model',
  desc: 'Sentiment analysis model',
  author: 'ML Team',
  force: true, // overwrite existing Kitfile
});

console.log(result.kitfilePath); // absolute path to the generated Kitfile
```

### `info(repository, tag, flags?)`

Returns the parsed Kitfile for a ModelKit. The result also carries a non-enumerable `_raw` property with the original YAML string.

```typescript
const kitfile = await info('registry.example.com/org/my-model', 'v1.0.0');
console.log(kitfile.package?.name);
console.log(kitfile.model?.path);
```

### `inspect(repository, tag, flags?)`

Returns the full OCI manifest and parsed Kitfile. Use `flags.remote` to inspect directly from a registry without pulling first.

```typescript
const result = await inspect('registry.example.com/org/my-model', 'v1.0.0', { remote: true });
console.log(result.digest);
console.log(result.manifest.layers);
```

### `pack(directory?, flags?)`

Packages a directory containing a Kitfile into a ModelKit.

```typescript
await pack('.', {
  tag: 'registry.example.com/org/my-model:v1.0.0',
  compression: 'zstd',
});
```

### `unpack(destination, flags?)`

Extracts a ModelKit into a directory. Use `flags.filter` to pull out specific layers or paths.

```typescript
// Extract everything
await unpack('./output');

// Model layer only
await unpack('./output', { filter: 'model' });

// A specific dataset and the full docs layer
await unpack('./output', { filter: 'datasets:validation,docs' });

// Don't fail if files already exist
await unpack('./output', { ignoreExisting: true });
```

### `list(repository?)`

Lists ModelKits. Omit the argument to list local storage; pass a registry/repository to list remote tags.

```typescript
const local = await list();
const remote = await list('registry.example.com/org/my-model');

for (const kit of local) {
  console.log(kit.repository, kit.tag, kit.size, kit.digest);
}
```

### `push(source, destination?)`

Pushes a ModelKit to a registry. Supply `destination` to push under a different reference (e.g. promote from staging to production).

```typescript
await push('registry.example.com/org/my-model:v1.0.0');

// Push to a different registry under a different tag
await push('staging.example.com/my-model:rc1', 'registry.example.com/org/my-model:v1.0.0');
```

### `pull(reference)`

Pulls a ModelKit from a registry into local storage.

```typescript
await pull('registry.example.com/org/my-model:v1.0.0');
```

### `loginUnsafe(registry, username, password)`

Authenticates with a registry. The password is passed as a CLI argument and will be visible in the process list — use `login` instead for production.

```typescript
await loginUnsafe('registry.example.com', 'user', 'pass');
```

### `login(registry, username, password)`

Same as `login` but passes the password via stdin, keeping it out of the process list. Preferred for CI and automated workflows.

```typescript
await login(
  'registry.example.com',
  process.env.REGISTRY_USER!,
  process.env.REGISTRY_PASS!,
);
```

### `logout(registry)`

```typescript
await logout('registry.example.com');
```

### `tag(source, destination)`

Assigns a new tag to an existing local ModelKit without re-packing. Use `push` afterward to publish it.

```typescript
await tag('registry.example.com/org/my-model:rc1', 'registry.example.com/org/my-model:v1.0.0');
```

### `remove(registry, repository, tagOrDigest, flags?)`

Removes a ModelKit from local storage or a remote registry.

```typescript
// Remove a specific tag
await remove('registry.example.com', 'org/my-model', 'v0.9.0');

// Remove all locally cached ModelKits
await remove('', '', '', { all: true });

// Force-remove from the remote registry
await remove('registry.example.com', 'org/my-model', 'v0.9.0', { force: true, remote: true });
```

### `version()`

Returns version information for the installed `kit` binary.

```typescript
const { version, commit, built, goVersion } = await version();
console.log(`kit ${version} (${commit})`);
```

### `kit(command, args, options?)`

Low-level escape hatch for running any `kit` subcommand directly, useful when the higher-level wrappers don't expose a flag you need.

```typescript
const result = await kit('pack', ['.', '--tag', 'my-model:latest'], { cwd: '/path/to/project' });
console.log(result.stdout);
```

## Error handling

All functions reject with a string message that includes the exit code and stderr output from the CLI. Wrap calls in `try/catch` to handle failures:

```typescript
try {
  await push('registry.example.com/org/my-model:v1.0.0');
} catch (err) {
  console.error(err); // "Kit command failed with exit code 1: ..."
  process.exit(1);
}
```

## Environment variables

| Variable | Description |
|---|---|
| `KITOPS_CLI_PATH` | Full path to the `kit` binary. Defaults to `kit` (resolved via `PATH`). |

## Examples

See the [`examples/`](./examples) directory for runnable scripts covering common workflows:

- [Build a Kitfile programmatically](./examples/build-kitfile.js)
- [CI/CD pipeline](./examples/ci-cd.js)
- [Tag and promote a release](./examples/tag-and-promote.js)
- [LLM fine-tuning dataset packaging](./examples/llm-prompts-ci.js)

## Development

```bash
pnpm install
pnpm build       # compile TypeScript
pnpm dev         # watch mode
pnpm test        # run tests
pnpm typecheck   # type-check without emitting
```

## Related

- [KitOps](https://kitops.org) — the ModelKit standard and CLI
- [pykitops](https://github.com/jozu-ai/kitops/tree/main/pykitops) — Python SDK
