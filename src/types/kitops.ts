/** The content layers a ModelKit can contain. */
export type Layer =
  | 'model'
  | 'datasets'
  | 'code'
  | 'docs'
  | 'prompts'

/**
 * A filter expression used by `unpack` and `info` to select specific layers
 * or individual paths within a layer.
 *
 * Accepted formats:
 *   - `'model'`                        — entire model layer
 *   - `'datasets:training'`            — named dataset
 *   - `'docs:./README.md'`             — single file within the docs layer
 *   - `'model,datasets:validation'`    — comma-separated (multiple layers)
 */
export type FilterFlag = `${Layer}${(`:${string}`) | ''}` | `${Layer}${(`:${string}`) | ''},${string}`

/** A single entry returned by `kit list`. */
export type ModelKit = {
  repository: string;
  tag: string;
  maintainer: string;
  name: string;
  size: string;
  digest: string;
};

/**
 * Union of all subcommands accepted by the `kit` binary.
 * @see https://kitops.org/docs/cli/cli-reference/
 */
export type KitCommand =
  | 'diff'
  | 'info'
  | 'inspect'
  | 'init'
  | 'list'
  | 'login'
  | 'logout'
  | 'pack'
  | 'pull'
  | 'push'
  | 'remove'
  | 'tag'
  | 'unpack'
  | 'version';

/** Raw output from a spawned `kit` process. */
export type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

/**
 * A `Promise<T>` that exposes a `cancel()` method to abort the underlying `kit` process.
 *
 * Calling `cancel()` sends `SIGTERM` to the child process and rejects the promise with a
 * `DOMException` named `'AbortError'`. In environments where `AbortController` is unavailable,
 * `cancel()` is a no-op and the operation runs to completion normally.
 *
 * Because `CancellablePromise<T>` extends `Promise<T>`, existing call sites using `await`
 * require no changes. Hold the reference before awaiting to gain access to `cancel()`.
 *
 * @example
 * ```ts
 * const op = pull('registry.example.com/org/model:v1');
 * setTimeout(() => op.cancel(), 30_000);
 * try {
 *   await op;
 * } catch (e) {
 *   if (e instanceof DOMException && e.name === 'AbortError') {
 *     console.log('Pull was cancelled');
 *   }
 * }
 * ```
 */
export type CancellablePromise<T> = Promise<T> & {
  /** Kills the underlying `kit` process and rejects the promise with an `AbortError`. */
  cancel: () => void;
};