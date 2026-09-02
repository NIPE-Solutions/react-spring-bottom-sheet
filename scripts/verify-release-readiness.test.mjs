import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import {
  readinessCommands,
  runReadinessChecks,
} from './verify-release-readiness.mjs'

const expectedCommands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:browser-matrix']],
  ['npm', ['audit', '--omit=dev']],
  ['npm', ['pack', '--dry-run']],
]

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
const ciWorkflow = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)
const releaseWorkflow = readFileSync(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
)

const requiredText = (url) => {
  assert.equal(existsSync(url), true, `missing ${url.pathname}`)
  return readFileSync(url, 'utf8')
}

const jobSource = (workflow, name) => {
  const marker = `  ${name}:\n`
  const start = workflow.indexOf(marker)
  assert.notEqual(start, -1, `missing ${name} job`)
  const remainder = workflow.slice(start + marker.length)
  const nextJob = remainder.search(/^ {2}[\w-]+:\s*$/m)
  return remainder.slice(0, nextJob === -1 ? undefined : nextJob)
}

const inlineCommands = (job) =>
  [...job.matchAll(/^ {6}- run: (.+)$/gm)].map((match) => match[1])

test('runs every readiness gate in deterministic order', () => {
  const calls = []
  const runner = (command, args, options) => {
    calls.push([command, args, options])
    return { status: 0 }
  }

  assert.equal(runReadinessChecks({ runner }), 0)
  assert.deepEqual(
    calls,
    expectedCommands.map(([command, args]) => [
      command,
      args,
      { stdio: 'inherit' },
    ]),
  )
})

test('stops at the first failed readiness gate', () => {
  const calls = []
  const runner = (command, args) => {
    calls.push([command, args])
    return { status: calls.length === 2 ? 17 : 0 }
  }

  assert.equal(runReadinessChecks({ runner }), 17)
  assert.deepEqual(calls, expectedCommands.slice(0, 2))
})

test('readiness gates contain no publication or repository mutation', () => {
  assert.deepEqual(readinessCommands, expectedCommands)
  assert.equal(
    readinessCommands.some(([command, args]) =>
      /publish|release create|npm dist-tag|git tag|npm version/.test(
        `${command} ${args.join(' ')}`,
      ),
    ),
    false,
  )
})

test('package scripts expose readiness and keep its policy tests in check', () => {
  assert.equal(
    packageJson.scripts['release:check'],
    'node scripts/verify-release-readiness.mjs',
  )
  assert.match(
    packageJson.scripts['test:release'],
    /scripts\/verify-release-readiness\.test\.mjs/,
  )
})

test('readiness report lists automated gates and leaves every sign-off open', () => {
  const report = requiredText(
    new URL('../docs/releases/v5-alpha-readiness.md', import.meta.url),
  )
  const automatedCommands = [
    'npm ci',
    'npm run release:check',
    'npm run test:e2e',
    'npm run test:website:e2e',
  ]
  const manualSignOffs = [
    'VoiceOver on macOS or iOS',
    'Keyboard-only modal and non-modal operation',
    'iOS Safari on a physical device',
    'Android Chrome on a physical device',
    'Production domain, sitemap, social metadata, and examples',
    'npm trusted publisher and GitHub `npm` environment protection',
  ]

  for (const command of automatedCommands) {
    assert.ok(report.includes(`- \`${command}\``), `missing ${command}`)
  }

  const checkboxes = [...report.matchAll(/^- \[([ xX])\] (.+)$/gm)]
  assert.deepEqual(
    checkboxes.map((match) => [match[1], match[2]]),
    manualSignOffs.map((signOff) => [' ', signOff]),
  )
  assert.match(report, /`npm audit --omit=dev`[^\n]*block/i)
  assert.match(
    report,
    /full development\s+audit[\s\S]{0,100}informational[\s\S]{0,100}triag/i,
  )
})

test('prerelease instructions order clean install before readiness and sign-off', () => {
  const releasing = requiredText(
    new URL('../docs/RELEASING.md', import.meta.url),
  )
  const prerelease = releasing.slice(
    releasing.indexOf('## Prepare a prerelease'),
    releasing.indexOf('## Publish the stable release'),
  )
  const milestones = [
    'npm ci',
    'npm run release:check',
    'npm run test:e2e',
    'npm run test:website:e2e',
    'Vercel preview',
    'manual sign-off',
    'Merge the reviewed release commit',
    'explicitly authorizes publication',
  ]

  let previous = -1
  for (const milestone of milestones) {
    const index = prerelease.indexOf(milestone)
    assert.ok(index > previous, `${milestone} must follow the prior milestone`)
    previous = index
  }
})

for (const [name, workflow] of [
  ['CI', ciWorkflow],
  ['release', releaseWorkflow],
]) {
  test(`${name} quality runs the composed readiness command once`, () => {
    assert.deepEqual(inlineCommands(jobSource(workflow, 'quality')), [
      'npm ci',
      'npm run release:check',
    ])
  })

  test(`${name} preserves desktop and touch browser execution`, () => {
    assert.match(
      jobSource(workflow, 'browsers'),
      /project: \[chromium, firefox, webkit\]/,
    )
    assert.match(
      jobSource(workflow, 'chromium-touch'),
      /npm run test:e2e -- --project=chromium-touch/,
    )
  })
}

test('release readiness completes before the protected publish job', () => {
  assert.match(
    jobSource(releaseWorkflow, 'verify'),
    /needs: \[quality, browsers, chromium-touch\]/,
  )
  assert.match(jobSource(releaseWorkflow, 'publish'), /^ {4}needs: verify$/m)
})
