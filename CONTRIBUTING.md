# Contributing

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev        # watch mode
pnpm build      # compile
pnpm typecheck  # type-check without emitting
pnpm test       # run tests
```

## Before opening a PR

- Run `pnpm typecheck` and `pnpm test` — both must pass
- Keep changes focused; one concern per PR
- If you're adding a new command wrapper, add a corresponding spec file under `src/commands/__tests__/`

## Project structure

```
src/
  commands/   # one file per kit subcommand
  core/       # exec utilities (spawn, arg prep, output parsers)
  types/      # TypeScript type definitions
examples/     # runnable JS examples
```

## Reporting bugs

Open an issue at https://github.com/jozu-ai/kitops-ts/issues. Include the `kit` binary version (`kit version`) and the Node.js version (`node --version`).
