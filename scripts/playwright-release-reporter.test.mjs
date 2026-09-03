import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

import { releaseTestViolation } from './playwright-release-reporter.mjs'
import { validateReadinessScriptGraph } from './verify-release-readiness.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const playwrightCli = join(
  repositoryRoot,
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
)
const packageScripts = JSON.parse(
  readFileSync(join(repositoryRoot, 'package.json'), 'utf8'),
).scripts

const fixtureEnvironment = (ci) => {
  const env = { ...process.env, FORCE_COLOR: '0' }
  if (ci) env.CI = 'true'
  else delete env.CI
  return env
}

const runFixture = ({
  ci = false,
  configFile = 'playwright.config.ts',
  playwrightArgs = [],
  retries = 0,
  source,
}) => {
  const fixtureRoot = mkdtempSync(
    join(repositoryRoot, '.playwright-release-policy-'),
  )
  const configPath = join(fixtureRoot, 'playwright.config.mjs')
  const testPath = join(fixtureRoot, 'policy.spec.mjs')
  const outputDir = join(fixtureRoot, 'output')

  try {
    mkdirSync(dirname(testPath), { recursive: true })
    writeFileSync(testPath, source)
    writeFileSync(
      configPath,
      [
        `import sourceConfig from ${JSON.stringify(
          pathToFileURL(join(repositoryRoot, configFile)).href,
        )}`,
        '',
        'export default {',
        '  ...sourceConfig,',
        `  testDir: ${JSON.stringify(fixtureRoot)},`,
        "  testMatch: 'policy.spec.mjs',",
        '  testIgnore: [],',
        '  fullyParallel: false,',
        '  forbidOnly: true,',
        `  retries: ${retries},`,
        '  workers: 1,',
        `  outputDir: ${JSON.stringify(outputDir)},`,
        '  use: {},',
        "  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],",
        '  webServer: undefined,',
        '}',
        '',
      ].join('\n'),
    )

    return spawnSync(
      process.execPath,
      [playwrightCli, 'test', '--config', configPath, ...playwrightArgs],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: fixtureEnvironment(ci),
      },
    )
  } finally {
    rmSync(fixtureRoot, { force: true, recursive: true })
  }
}

const outputFrom = (result) => `${result.stdout}\n${result.stderr}`

const assertPolicyFailure = (result) => {
  assert.notEqual(result.status, 0, outputFrom(result))
  assert.match(outputFrom(result), /release test execution policy/i)
}

const passingReleaseTest = [
  "import { test } from '@playwright/test'",
  '',
  "test('passes normally', { tag: '@release:passing-control' }, async () => {})",
  '',
].join('\n')

for (const configFile of [
  'playwright.config.ts',
  'playwright.website.config.ts',
]) {
  for (const [environment, ci] of [
    ['with CI unset', false],
    ['with CI=true', true],
  ]) {
    test(`${configFile} allows a normally passing release test ${environment}`, () => {
      const result = runFixture({ ci, configFile, source: passingReleaseTest })

      assert.equal(result.status, 0, outputFrom(result))
    })

    test(`${configFile} rejects a runtime-conditional release skip ${environment}`, () => {
      const result = runFixture({
        ci,
        configFile,
        source: [
          "import { test } from '@playwright/test'",
          '',
          'test.skip(',
          "  ({ browserName }) => browserName === 'chromium',",
          "  'runtime project skip',",
          ')',
          "test('must execute', { tag: '@release:runtime-project' }, async () => {})",
          '',
        ].join('\n'),
      })

      assertPolicyFailure(result)
    })
  }
}

for (const [configFile, scriptName, canonicalCommand] of [
  ['playwright.config.ts', 'test:e2e', 'playwright test'],
  [
    'playwright.website.config.ts',
    'test:website:e2e',
    'playwright test --config playwright.website.config.ts',
  ],
]) {
  test(`rejects a ${scriptName} reporter override that disables the release policy`, () => {
    const result = runFixture({
      configFile,
      playwrightArgs: ['--reporter=list'],
      source: [
        "import { test } from '@playwright/test'",
        '',
        "test('must execute', { tag: '@release:reporter-override' }, async () => {",
        "  test.skip(true, 'runtime body skip')",
        '})',
        '',
      ].join('\n'),
    })

    assert.equal(result.status, 0, outputFrom(result))
    assert.doesNotMatch(outputFrom(result), /release test execution policy/i)

    const errors = validateReadinessScriptGraph({
      scripts: {
        ...packageScripts,
        [scriptName]: `${canonicalCommand} --reporter=list`,
      },
    }).join('\n')
    assert.match(errors, new RegExp(`${scriptName} must be exactly`))
  })

  test(`rejects a ${scriptName} filter that omits every release test`, () => {
    const result = runFixture({
      configFile,
      playwrightArgs: ['--grep-invert', '@release:'],
      source: [
        "import { test } from '@playwright/test'",
        '',
        "test('omitted release case', { tag: '@release:filtered' }, async () => {",
        "  test.skip(true, 'would violate the policy if selected')",
        '})',
        "test('selected ordinary case', async () => {})",
        '',
      ].join('\n'),
    })

    assert.equal(result.status, 0, outputFrom(result))
    assert.doesNotMatch(outputFrom(result), /release test execution policy/i)

    const errors = validateReadinessScriptGraph({
      scripts: {
        ...packageScripts,
        [scriptName]: `${canonicalCommand} --grep-invert @release:`,
      },
    }).join('\n')
    assert.match(errors, new RegExp(`${scriptName} must be exactly`))
  })
}

test('rejects a release test skipped from its test body', () => {
  const result = runFixture({
    source: [
      "import { test } from '@playwright/test'",
      '',
      "test('must execute', { tag: '@release:body-skip' }, async () => {",
      "  test.skip(true, 'runtime body skip')",
      '})',
      '',
    ].join('\n'),
  })

  assertPolicyFailure(result)
})

test('rejects a runtime expected failure for a release test', () => {
  const result = runFixture({
    source: [
      "import { test } from '@playwright/test'",
      '',
      "test('must pass', { tag: '@release:runtime-fail' }, async () => {",
      "  test.fail(true, 'runtime expected failure')",
      "  throw new Error('expected failure')",
      '})',
      '',
    ].join('\n'),
  })

  assertPolicyFailure(result)
})

test('rejects a release test marked fixme', () => {
  const result = runFixture({
    source: [
      "import { test } from '@playwright/test'",
      '',
      "test.fixme('must execute', { tag: '@release:fixme' }, async () => {})",
      '',
    ].join('\n'),
  })

  assertPolicyFailure(result)
})

test('rejects a flaky release test that only passes on retry', () => {
  const result = runFixture({
    retries: 1,
    source: [
      "import { test } from '@playwright/test'",
      '',
      "test('must pass normally', { tag: '@release:flaky' }, async ({}, testInfo) => {",
      "  if (testInfo.retry === 0) throw new Error('first attempt fails')",
      '})',
      '',
    ].join('\n'),
  })

  assertPolicyFailure(result)
})

test('allows parameterized release tests from one registration site', () => {
  const result = runFixture({
    source: [
      "import { test } from '@playwright/test'",
      '',
      "for (const value of ['one', 'two']) {",
      '  test(',
      '    `passes ${value}`,',
      "    { tag: '@release:parameterized-control' },",
      '    async () => {},',
      '  )',
      '}',
      '',
    ].join('\n'),
  })

  assert.equal(result.status, 0, outputFrom(result))
})

test('preserves ordinary non-release runtime skips', () => {
  const result = runFixture({
    source: [
      "import { test } from '@playwright/test'",
      '',
      "test.skip(({ browserName }) => browserName === 'chromium', 'ordinary skip')",
      "test('not release evidence', async () => {})",
      '',
    ].join('\n'),
  })

  assert.equal(result.status, 0, outputFrom(result))
})

const policyTest = ({
  annotations = [],
  expectedStatus = 'passed',
  outcome = 'expected',
  results = [{ status: 'passed' }],
  tags = ['@release:synthetic'],
} = {}) => ({
  annotations,
  expectedStatus,
  location: { file: 'fixture.spec.mjs', line: 1, column: 1 },
  outcome: () => outcome,
  results,
  tags,
  titlePath: () => ['chromium', 'fixture.spec.mjs', 'release test'],
})

test('classifies every non-normal release result as a policy violation', () => {
  assert.equal(releaseTestViolation(policyTest()), null)
  assert.equal(
    releaseTestViolation(
      policyTest({ results: [{ status: 'passed' }, { status: 'passed' }] }),
    ),
    null,
  )
  for (const status of [
    'failed',
    'timedOut',
    'skipped',
    'interrupted',
    undefined,
  ]) {
    assert.equal(
      releaseTestViolation(
        policyTest({ results: [{ status: 'passed' }, { status }] }),
      ),
      `finished with ${status ?? 'no status'} instead of passed`,
    )
  }
  assert.equal(
    releaseTestViolation(
      policyTest({
        annotations: [{ type: 'skip' }],
        expectedStatus: 'skipped',
        outcome: 'skipped',
        results: [{ status: 'skipped' }],
      }),
    ),
    'expected skipped instead of passed',
  )
  assert.equal(
    releaseTestViolation(
      policyTest({
        annotations: [{ type: 'fixme' }],
        expectedStatus: 'skipped',
        outcome: 'skipped',
        results: [{ status: 'skipped' }],
      }),
    ),
    'expected skipped instead of passed',
  )
  assert.equal(
    releaseTestViolation(
      policyTest({
        annotations: [{ type: 'fail' }],
        expectedStatus: 'failed',
        results: [{ status: 'failed' }],
      }),
    ),
    'expected failed instead of passed',
  )
  assert.equal(
    releaseTestViolation(
      policyTest({ outcome: 'skipped', results: [{ status: 'interrupted' }] }),
    ),
    'finished with interrupted instead of passed',
  )
  assert.equal(
    releaseTestViolation(policyTest({ outcome: 'flaky' })),
    'had flaky instead of expected outcome',
  )
  assert.equal(
    releaseTestViolation(policyTest({ results: [] })),
    'did not produce an execution result',
  )
  assert.equal(
    releaseTestViolation(
      policyTest({ outcome: 'unexpected', results: [{ status: 'failed' }] }),
    ),
    'finished with failed instead of passed',
  )
})

test('does not classify non-release outcomes', () => {
  assert.equal(
    releaseTestViolation(
      policyTest({
        expectedStatus: 'skipped',
        outcome: 'skipped',
        results: [{ status: 'skipped' }],
        tags: [],
      }),
    ),
    null,
  )
})
