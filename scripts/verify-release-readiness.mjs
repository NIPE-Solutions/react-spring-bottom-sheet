import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

import { parseWorkflowModel } from './release-policy.mjs'

export const readinessCommands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:browser-matrix']],
  ['npm', ['audit', '--omit=dev']],
  ['npm', ['pack', '--dry-run']],
]

export function runReadinessChecks({
  commands = readinessCommands,
  runner = spawnSync,
} = {}) {
  for (const [command, args] of commands) {
    const result = runner(command, args, { stdio: 'inherit' })

    if (result.status !== 0) return result.status ?? 1
  }

  return 0
}

const commandsIn = (job) => job?.steps.flatMap((step) => step.commands) ?? []

const sameCommands = (actual, expected) =>
  actual.length === expected.length &&
  actual.every((command, index) => command === expected[index])

const dependsOn = (jobs, jobName, dependencyName, seen = new Set()) => {
  if (seen.has(jobName)) return false
  seen.add(jobName)

  const job = jobs.get(jobName)
  return (
    job?.needs.includes(dependencyName) ||
    job?.needs.some((dependency) =>
      dependsOn(jobs, dependency, dependencyName, seen),
    ) ||
    false
  )
}

export function validateReadinessWorkflows({ ciWorkflow, releaseWorkflow }) {
  const errors = []

  for (const [label, workflow] of [
    ['CI', ciWorkflow],
    ['release', releaseWorkflow],
  ]) {
    const jobs = new Map(
      parseWorkflowModel(workflow).map((job) => [job.name, job]),
    )
    const quality = jobs.get('quality')
    const browsers = jobs.get('browsers')
    const touch = jobs.get('chromium-touch')

    if (
      !sameCommands(commandsIn(quality), ['npm ci', 'npm run release:check'])
    ) {
      errors.push(
        `${label} quality must run only npm ci and npm run release:check`,
      )
    }
    if (
      !browsers ||
      !browsers.needs.includes('quality') ||
      !commandsIn(browsers).includes(
        'npm run test:e2e -- --project=${{ matrix.project }}',
      ) ||
      !commandsIn(browsers).includes(
        'npm run test:website:e2e -- --project=${{ matrix.project }}',
      )
    ) {
      errors.push(`${label} browsers must execute after quality`)
    }
    if (
      !touch ||
      !touch.needs.includes('quality') ||
      !commandsIn(touch).includes(
        'npm run test:e2e -- --project=chromium-touch',
      )
    ) {
      errors.push(`${label} chromium-touch must execute its browser project`)
    }

    if (label === 'release') {
      const publish = [...jobs.values()].find((job) =>
        commandsIn(job).some((command) => command.startsWith('npm publish ')),
      )
      if (!publish || !dependsOn(jobs, publish.name, 'quality')) {
        errors.push('release publish must depend on quality readiness')
      }
    }
  }

  return errors
}

const releaseMutation =
  /\bnpm\s+(?:publish|version|dist-tag)\b|\bgit\s+tag\b|\bgh\s+release\b|\bsemantic-release\b/

const referencedScripts = (command) =>
  [...command.matchAll(/\bnpm\s+run(?:\s+--[\w-]+)*\s+([\w:-]+)/g)].map(
    (match) => match[1],
  )

export function validateReadinessScriptGraph({
  scripts,
  commands = readinessCommands,
}) {
  const errors = []
  const states = new Map()
  const manifestScripts = commands.flatMap(([command, args]) =>
    command === 'npm' && args[0] === 'run' && args[1] ? [args[1]] : [],
  )
  const packHooks = commands.some(
    ([command, args]) => command === 'npm' && args[0] === 'pack',
  )
    ? ['prepack', 'prepare', 'postpack'].filter((hook) => scripts[hook])
    : []

  const visit = (name, path) => {
    if (states.get(name) === 'visiting') {
      const cycleStart = path.indexOf(name)
      const cycle = [...path.slice(cycleStart), name]
      errors.push(`readiness package-script cycle: ${cycle.join(' -> ')}`)
      return
    }
    if (states.get(name) === 'visited') return

    const command = scripts[name]
    if (!command) {
      errors.push(`reachable readiness script is missing: ${name}`)
      return
    }

    states.set(name, 'visiting')
    if (releaseMutation.test(command)) {
      errors.push(`reachable script ${name} contains a release mutation`)
    }

    const dependencies = referencedScripts(command)
    if (name === 'release:check') {
      dependencies.push(...manifestScripts, ...packHooks)
    }
    for (const dependency of dependencies) {
      visit(dependency, [...path, name])
    }
    states.set(name, 'visited')
  }

  visit('release:check', [])
  return [...new Set(errors)]
}

export function runReadinessCli(options) {
  const status = runReadinessChecks(options)
  process.exitCode = status
  return status
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  runReadinessCli()
}
