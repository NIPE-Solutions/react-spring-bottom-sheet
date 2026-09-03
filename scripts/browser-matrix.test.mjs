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
import { discoverReleaseTests } from './playwright-inventory.mjs'

const projectNames = (config) =>
  config.projects?.map((project) => project.name).filter(Boolean) ?? []

const libraryProjects = projectNames(libraryConfig)
const websiteProjects = projectNames(websiteConfig)
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
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
  writeFileSync(
    join(testsDirectory, 'inventory.spec.mjs'),
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
  )

  try {
    assert.deepEqual(
      discoverReleaseTests({
        config: join(directory, 'playwright.config.mjs'),
        suite: 'library',
      }).map(({ scenario, suite, title }) => ({ scenario, suite, title })),
      [
        {
          scenario: 'registered',
          suite: 'library',
          title: 'registered test',
        },
      ],
    )
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
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
        },
      ],
    }),
    ['unknown release scenarios registered: unknown-behavior'],
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
