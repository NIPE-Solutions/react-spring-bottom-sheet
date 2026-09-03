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

const desktopProjects = ['chromium', 'firefox', 'webkit']
const desktopCommands = [
  'npx playwright install --with-deps ${{ matrix.project }}',
  'npm run test:e2e -- --project=${{ matrix.project }}',
  'npm run test:website:e2e -- --project=${{ matrix.project }}',
]
const desktopJobCommands = ['npm ci', ...desktopCommands]
const touchInstallCommand = 'npx playwright install --with-deps chromium'
const touchTestCommand = 'npm run test:e2e -- --project=chromium-touch'
const touchJobCommands = ['npm ci', touchInstallCommand, touchTestCommand]

const stepsWithCommand = (job, command) =>
  job?.steps.filter((step) => step.commands.includes(command)) ?? []

const hasBlockingDefaultPolicy = (step) =>
  step.if === '' &&
  (step.continueOnError === '' || step.continueOnError === 'false')

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
    const workflowJobs = parseWorkflowModel(workflow)
    const jobs = new Map(workflowJobs.map((job) => [job.name, job]))
    const quality = jobs.get('quality')
    const browsers = jobs.get('browsers')
    const touch = jobs.get('chromium-touch')
    const nonUbuntuJobs = workflowJobs
      .filter((job) => job.runsOn !== 'ubuntu-latest')
      .map((job) => job.name)

    if (nonUbuntuJobs.length > 0) {
      errors.push(
        `${label} jobs must run on ubuntu-latest: ${nonUbuntuJobs.join(', ')}`,
      )
    }

    if (
      !sameCommands(commandsIn(quality), ['npm ci', 'npm run release:check'])
    ) {
      errors.push(
        `${label} quality must run only npm ci and npm run release:check`,
      )
    }
    if (!browsers || !browsers.needs.includes('quality')) {
      errors.push(`${label} browsers must execute after quality`)
    }
    if (
      !browsers ||
      !sameCommands(browsers.matrix.keys, ['project']) ||
      !sameCommands(browsers.matrix.project, desktopProjects)
    ) {
      errors.push(
        `${label} browsers must use exactly chromium, firefox, webkit`,
      )
    }
    if (!browsers || !sameCommands(commandsIn(browsers), desktopJobCommands)) {
      errors.push(
        `${label} browsers must install and execute each desktop project in both suites`,
      )
    }
    const desktopSteps = desktopCommands.flatMap((command) =>
      stepsWithCommand(browsers, command),
    )
    if (desktopSteps.some((step) => !hasBlockingDefaultPolicy(step))) {
      errors.push(
        `${label} browser steps must be unconditional and non-tolerated`,
      )
    }
    if (browsers && !hasBlockingDefaultPolicy(browsers)) {
      errors.push(
        `${label} browsers job must be unconditional and non-tolerated`,
      )
    }
    if (
      !touch ||
      !touch.needs.includes('quality') ||
      !commandsIn(touch).includes(touchTestCommand)
    ) {
      errors.push(`${label} chromium-touch must execute its browser project`)
    }
    const touchSteps = [touchInstallCommand, touchTestCommand].flatMap(
      (command) => stepsWithCommand(touch, command),
    )
    if (touchSteps.some((step) => !hasBlockingDefaultPolicy(step))) {
      errors.push(
        `${label} chromium-touch steps must be unconditional and non-tolerated`,
      )
    }
    if (touch && !hasBlockingDefaultPolicy(touch)) {
      errors.push(
        `${label} chromium-touch job must be unconditional and non-tolerated`,
      )
    }
    const touchReferences = workflowJobs.flatMap((job) =>
      commandsIn(job).filter((command) => command.includes('chromium-touch')),
    )
    if (
      workflowJobs.filter((job) => job.name === 'chromium-touch').length !==
        1 ||
      !touch ||
      touch.matrix.keys.length !== 0 ||
      !sameCommands(commandsIn(touch), touchJobCommands) ||
      touchReferences.length !== 1 ||
      touchReferences[0] !== touchTestCommand
    ) {
      errors.push(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      )
    }

    if (label === 'release') {
      const publish = [...jobs.values()].find((job) =>
        commandsIn(job).some((command) => command.startsWith('npm publish ')),
      )
      if (!publish || !dependsOn(jobs, publish.name, 'quality')) {
        errors.push('release publish must depend on quality readiness')
      }
      if (
        publish &&
        (!dependsOn(jobs, publish.name, 'browsers') ||
          !dependsOn(jobs, publish.name, 'chromium-touch'))
      ) {
        errors.push(
          'release publish must depend on desktop and touch browser readiness',
        )
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

    const npmRunTargets = referencedScripts(command)
    if (name === 'release:check') {
      npmRunTargets.push(...manifestScripts)
    }
    for (const target of npmRunTargets) {
      const lifecycleScripts = [
        scripts[`pre${target}`] ? `pre${target}` : null,
        target,
        scripts[`post${target}`] ? `post${target}` : null,
      ].filter(Boolean)

      for (const dependency of lifecycleScripts) {
        visit(dependency, [...path, name])
      }
    }
    if (name === 'release:check') {
      for (const hook of packHooks) visit(hook, [...path, name])
    }
    states.set(name, 'visited')
  }

  for (const root of [
    scripts['prerelease:check'] ? 'prerelease:check' : null,
    'release:check',
    scripts['postrelease:check'] ? 'postrelease:check' : null,
  ].filter(Boolean)) {
    visit(root, [])
  }
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
