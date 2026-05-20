import { cancellable, prepareArgs, runCommand } from '../core/exec.js'
import type { DiffFlags, DiffLayerEntry, DiffResult } from '../types/commands.js'
import type { CancellablePromise } from '../types/kitops.js'

/**
 * Compares two ModelKits and returns the differences in their layers.
 *
 * Prefix references with `local://` for local storage or `remote://` for remote registries.
 * If no prefix is given, local storage is checked first.
 *
 * Returns a {@link CancellablePromise}. Call `.cancel()` on the returned value to abort
 * the operation at any time.
 *
 * @see https://kitops.org/docs/cli/cli-reference/#kit-diff
 */
export function diff(reference1: string, reference2: string, flags?: DiffFlags): CancellablePromise<DiffResult> {
  return cancellable((signal) => {
    const args = [reference1, reference2, ...(flags ? prepareArgs(flags) : [])]
    return runCommand('diff', args, undefined, { signal }).then((result) =>
      parseDiffOutput(result.stdout, reference1, reference2),
    )
  })
}

function parseDiffOutput(output: string, ref1: string, ref2: string): DiffResult {
  const lines = output.split('\n')

  const diffResult: DiffResult = {
    modelKit1: ref1,
    modelKit2: ref2,
    configsDiffer: false,
    annotationsIdentical: true,
    sharedLayers: [],
    uniqueToKit1: [],
    uniqueToKit2: [],
  }

  let section = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('Configurations:')) {
      section = 'configs'
    } else if (trimmed.startsWith('Annotations:')) {
      section = 'annotations'
    } else if (trimmed.startsWith('Shared Layers')) {
      section = 'shared'
    } else if (trimmed.startsWith('Unique Layers to ModelKit1')) {
      section = 'unique1'
    } else if (trimmed.startsWith('Unique Layers to ModelKit2')) {
      section = 'unique2'
    } else if (trimmed.startsWith('---') || trimmed.startsWith('Type') || !trimmed) {
      continue
    } else if (section === 'configs') {
      if (trimmed === 'Configs differ:') {
        diffResult.configsDiffer = true
      } else if (trimmed.startsWith('ModelKit1 Config Digest:')) {
        diffResult.config1Digest = trimmed.split(':').slice(1).join(':').trim()
      } else if (trimmed.startsWith('ModelKit2 Config Digest:')) {
        diffResult.config2Digest = trimmed.split(':').slice(1).join(':').trim()
      }
    } else if (section === 'annotations') {
      if (trimmed.includes('Annotations differ')) {
        diffResult.annotationsIdentical = false
      }
    } else if (section === 'shared' || section === 'unique1' || section === 'unique2') {
      if (trimmed === '<none>') {
        continue
      }
      const parts = trimmed.split('|').map(p => p.trim())
      if (parts.length >= 3) {
        const entry: DiffLayerEntry = {
          type: parts[0],
          digest: parts[1],
          size: parts[2],
        }
        if (section === 'shared') {
          diffResult.sharedLayers.push(entry)
        } else if (section === 'unique1') {
          diffResult.uniqueToKit1.push(entry)
        } else {
          diffResult.uniqueToKit2.push(entry)
        }
      }
    }
  }

  return diffResult
}
