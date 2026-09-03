import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import libraryConfig from '../playwright.config.ts'
import websiteConfig from '../playwright.website.config.ts'
import {
  releaseScenarioRegistry,
  releaseScenarios,
  validateBrowserMatrix,
} from './browser-matrix.mjs'
import * as playwrightInventory from './playwright-inventory.mjs'

const { discoverReleaseTests } = playwrightInventory

const projectNames = (config) =>
  config.projects?.map((project) => project.name).filter(Boolean) ?? []

const libraryProjects = projectNames(libraryConfig)
const websiteProjects = projectNames(websiteConfig)
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const discoverFixtureReleaseTests = (source) => {
  const directory = mkdtempSync(join(repositoryRoot, '.playwright-inventory-'))
  const testsDirectory = join(directory, 'tests')
  mkdirSync(testsDirectory)
  writeFileSync(
    join(directory, 'playwright.config.mjs'),
    [
      "import { defineConfig } from '@playwright/test'",
      '',
      'export default defineConfig({',
      "  testDir: './tests',",
      "  projects: [{ name: 'chromium' }],",
      '})',
      '',
    ].join('\n'),
  )
  writeFileSync(join(testsDirectory, 'inventory.spec.mjs'), source)

  try {
    return discoverReleaseTests({
      config: join(directory, 'playwright.config.mjs'),
      suite: 'library',
    })
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

const releaseTests = [
  ...discoverReleaseTests({
    config: 'playwright.config.ts',
    suite: 'library',
  }),
  ...discoverReleaseTests({
    config: 'playwright.website.config.ts',
    suite: 'website',
  }),
]

const validate = (overrides = {}) =>
  validateBrowserMatrix({
    libraryProjects,
    websiteProjects,
    releaseTests,
    ...overrides,
  })

test('accepts the configured browser projects and registered release tests', () => {
  assert.deepEqual(validate(), [])
})

test('discovers release tags only from registered Playwright test metadata', () => {
  assert.deepEqual(
    discoverFixtureReleaseTests(
      [
        "import { test } from '@playwright/test'",
        '',
        "const inertText = '@release:string-only'",
        'void inertText',
        '// @release:comment-only',
        "test('ordinary test', async () => {})",
        "test('registered test', { tag: '@release:registered' }, async () => {})",
        '',
      ].join('\n'),
    ).map(({ scenario, suite, title }) => ({ scenario, suite, title })),
    [
      {
        scenario: 'registered',
        suite: 'library',
        title: 'registered test',
      },
    ],
  )
})

test('carries Playwright status and annotations from a controlled report', () => {
  const report = {
    suites: [
      {
        specs: [
          {
            title: 'skipped test',
            tags: ['release:skipped-test'],
            file: 'inventory.spec.mjs',
            line: 3,
            column: 1,
            tests: [
              {
                projectName: 'chromium',
                expectedStatus: 'skipped',
                annotations: [{ type: 'skip', description: 'disabled' }],
              },
            ],
          },
          {
            title: 'expected failure',
            tags: ['release:expected-failure'],
            file: 'inventory.spec.mjs',
            line: 4,
            column: 1,
            tests: [
              {
                projectName: 'chromium',
                expectedStatus: 'passed',
                annotations: [{ type: 'fail' }],
              },
            ],
          },
        ],
      },
    ],
  }

  assert.deepEqual(
    playwrightInventory.releaseTestsFromReport?.({
      report,
      suite: 'library',
    }),
    [
      {
        scenario: 'skipped-test',
        suite: 'library',
        file: 'inventory.spec.mjs',
        line: 3,
        column: 1,
        title: 'skipped test',
        projectName: 'chromium',
        expectedStatus: 'skipped',
        annotations: [{ type: 'skip', description: 'disabled' }],
      },
      {
        scenario: 'expected-failure',
        suite: 'library',
        file: 'inventory.spec.mjs',
        line: 4,
        column: 1,
        title: 'expected failure',
        projectName: 'chromium',
        expectedStatus: 'passed',
        annotations: [{ type: 'fail' }],
      },
    ],
  )
})

test('discovers static skip, fixme, and expected-failure metadata from Playwright', () => {
  const discovered = discoverFixtureReleaseTests(
    [
      "import { test } from '@playwright/test'",
      '',
      "test.skip('skipped test', { tag: '@release:skipped-test' }, async () => {})",
      "test.fixme('fixme test', { tag: '@release:fixme-test' }, async () => {})",
      "test.fail('expected failure', { tag: '@release:expected-failure' }, async () => {})",
      '',
    ].join('\n'),
  )

  assert.deepEqual(
    discovered.map(
      ({ scenario, expectedStatus, annotations, projectName }) => ({
        scenario,
        expectedStatus,
        annotationTypes: (annotations ?? []).map(({ type }) => type),
        projectName,
      }),
    ),
    [
      {
        scenario: 'skipped-test',
        expectedStatus: 'skipped',
        annotationTypes: ['skip'],
        projectName: 'chromium',
      },
      {
        scenario: 'fixme-test',
        expectedStatus: 'skipped',
        annotationTypes: ['fixme'],
        projectName: 'chromium',
      },
      {
        scenario: 'expected-failure',
        expectedStatus: 'passed',
        annotationTypes: ['fail'],
        projectName: 'chromium',
      },
    ],
  )
})

for (const project of ['chromium', 'firefox', 'webkit']) {
  test(`requires ${project} in the library browser suite`, () => {
    assert.deepEqual(
      validate({
        libraryProjects: libraryProjects.filter(
          (candidate) => candidate !== project,
        ),
      }),
      [`library projects missing: ${project}`],
    )
  })

  test(`requires ${project} in the website browser suite`, () => {
    assert.deepEqual(
      validate({
        websiteProjects: websiteProjects.filter(
          (candidate) => candidate !== project,
        ),
      }),
      [`website projects missing: ${project}`],
    )
  })
}

test('requires the Chromium touch project for library gestures only', () => {
  assert.deepEqual(
    validate({
      libraryProjects: libraryProjects.filter(
        (project) => project !== 'chromium-touch',
      ),
    }),
    ['library projects missing: chromium-touch'],
  )
})

for (const scenario of releaseScenarios) {
  test(`detects removal of the ${scenario} registered release test`, () => {
    assert.deepEqual(
      validate({
        releaseTests: releaseTests.filter(
          (candidate) => candidate.scenario !== scenario,
        ),
      }),
      [`release scenarios missing: ${scenario}`],
    )
  })
}

test('detects a release test retagged as another known scenario', () => {
  const releaseTestsWithRetag = releaseTests.map((releaseTest) =>
    releaseTest.scenario === 'modal-focus-isolation'
      ? { ...releaseTest, scenario: 'mouse-drag' }
      : releaseTest,
  )

  assert.deepEqual(validate({ releaseTests: releaseTestsWithRetag }), [
    'release scenarios missing: modal-focus-isolation',
    'release scenarios registered at multiple sites: mouse-drag',
  ])
})

test('detects a retag mutation through native Playwright discovery', () => {
  const source = [
    "import { test } from '@playwright/test'",
    '',
    "test('primary', { tag: '@release:primary' }, async () => {})",
    "test('secondary', { tag: '@release:secondary' }, async () => {})",
    '',
  ].join('\n')
  const mutatedSource = source.replace('@release:primary', '@release:secondary')

  assert.deepEqual(
    validate({
      releaseTests: discoverFixtureReleaseTests(mutatedSource),
      scenarioRegistry: {
        primary: { suite: 'library' },
        secondary: { suite: 'library' },
      },
    }),
    [
      'release scenarios missing: primary',
      'release scenarios registered at multiple sites: secondary',
    ],
  )
})

test('detects an inventory scenario mapped to the wrong suite', () => {
  const scenarioRegistry = {
    ...releaseScenarioRegistry,
    'modal-focus-isolation': { suite: 'website' },
  }

  assert.deepEqual(validate({ scenarioRegistry }), [
    'release scenario modal-focus-isolation expected website but was registered in library',
  ])
})

test('detects the same release tag registered at another source site', () => {
  const original = releaseTests.find(
    ({ scenario }) => scenario === 'modal-focus-isolation',
  )

  assert.deepEqual(
    validate({
      releaseTests: [
        ...releaseTests,
        { ...original, file: 'duplicate.spec.ts', line: 10 },
      ],
    }),
    ['release scenarios registered at multiple sites: modal-focus-isolation'],
  )
})

test('detects duplicate registration sites through native Playwright discovery', () => {
  const discovered = discoverFixtureReleaseTests(
    [
      "import { test } from '@playwright/test'",
      '',
      "test('first', { tag: '@release:duplicate' }, async () => {})",
      "test('second', { tag: '@release:duplicate' }, async () => {})",
      '',
    ].join('\n'),
  )

  assert.deepEqual(
    validate({
      releaseTests: discovered,
      scenarioRegistry: { duplicate: { suite: 'library' } },
    }),
    ['release scenarios registered at multiple sites: duplicate'],
  )
})

test('allows parameterized release tests from one source registration site', () => {
  const original = releaseTests.find(
    ({ scenario }) => scenario === 'website-accessibility',
  )

  assert.deepEqual(
    validate({
      releaseTests: [
        ...releaseTests,
        { ...original, title: 'another parameterized instance' },
      ],
    }),
    [],
  )
})

test('allows parameterized cases discovered from one Playwright registration site', () => {
  const discovered = discoverFixtureReleaseTests(
    [
      "import { test } from '@playwright/test'",
      '',
      "for (const title of ['first case', 'second case']) {",
      "  test(title, { tag: '@release:parameterized' }, async () => {})",
      '}',
      '',
    ].join('\n'),
  )
  const registrationSites = new Set(
    discovered.map(
      ({ suite, file, line, column }) => `${suite}:${file}:${line}:${column}`,
    ),
  )

  assert.equal(discovered.length, 2)
  assert.equal(registrationSites.size, 1)
  assert.deepEqual(
    validate({
      releaseTests: discovered,
      scenarioRegistry: { parameterized: { suite: 'library' } },
    }),
    [],
  )
})

for (const [label, expectedStatus, annotations] of [
  ['statically skipped', 'skipped', [{ type: 'skip' }]],
  ['marked fixme', 'skipped', [{ type: 'fixme' }]],
  ['marked as an expected failure', 'passed', [{ type: 'fail' }]],
]) {
  test(`rejects a required release test that is ${label}`, () => {
    const releaseTestsWithDisabledScenario = releaseTests.map((releaseTest) =>
      releaseTest.scenario === 'modal-focus-isolation'
        ? { ...releaseTest, expectedStatus, annotations }
        : releaseTest,
    )

    assert.match(
      validate({ releaseTests: releaseTestsWithDisabledScenario }).join('\n'),
      /release scenarios must execute normally: modal-focus-isolation/,
    )
  })
}

test('rejects disabled registrations discovered from a real Playwright fixture', () => {
  const discovered = discoverFixtureReleaseTests(
    [
      "import { test } from '@playwright/test'",
      '',
      "test.skip('skipped', { tag: '@release:skipped' }, async () => {})",
      "test.fixme('fixme', { tag: '@release:fixme' }, async () => {})",
      "test.fail('expected failure', { tag: '@release:expected-failure' }, async () => {})",
      '',
    ].join('\n'),
  )
  const errors = validate({
    releaseTests: discovered,
    scenarioRegistry: {
      skipped: { suite: 'library' },
      fixme: { suite: 'library' },
      'expected-failure': { suite: 'library' },
    },
  }).join('\n')

  assert.match(errors, /release scenarios must execute normally:/)
  assert.match(errors, /skipped/)
  assert.match(errors, /fixme/)
  assert.match(errors, /expected-failure/)
})

test('detects a registered release tag that is absent from the inventory', () => {
  assert.deepEqual(
    validate({
      releaseTests: [
        ...releaseTests,
        {
          scenario: 'unknown-behavior',
          suite: 'library',
          file: 'unknown.spec.ts',
          line: 1,
          column: 1,
          title: 'unknown behavior',
          projectName: 'chromium',
          expectedStatus: 'passed',
          annotations: [],
        },
      ],
    }),
    ['unknown release scenarios registered: unknown-behavior'],
  )
})

test('treats Object prototype names as unknown release scenarios', () => {
  const discovered = discoverFixtureReleaseTests(
    [
      "import { test } from '@playwright/test'",
      '',
      "test('known', { tag: '@release:known' }, async () => {})",
      "test('prototype name', { tag: '@release:constructor' }, async () => {})",
      '',
    ].join('\n'),
  )

  assert.deepEqual(
    validate({
      releaseTests: discovered,
      scenarioRegistry: { known: { suite: 'library' } },
    }),
    ['unknown release scenarios registered: constructor'],
  )
})

test('aggregates missing projects and release scenarios', () => {
  assert.deepEqual(
    validate({
      libraryProjects: [],
      websiteProjects: [],
      releaseTests: [],
    }),
    [
      'library projects missing: chromium, firefox, webkit, chromium-touch',
      'website projects missing: chromium, firefox, webkit',
      `release scenarios missing: ${releaseScenarios.join(', ')}`,
    ],
  )
})
