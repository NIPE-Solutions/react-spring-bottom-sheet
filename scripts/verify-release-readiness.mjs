import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const readinessCommands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:browser-matrix']],
  ['npm', ['audit', '--omit=dev']],
  ['npm', ['pack', '--dry-run']],
]

export function runReadinessChecks({ runner = spawnSync } = {}) {
  for (const [command, args] of readinessCommands) {
    const result = runner(command, args, { stdio: 'inherit' })

    if (result.status !== 0) return result.status ?? 1
  }

  return 0
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  process.exitCode = runReadinessChecks()
}
