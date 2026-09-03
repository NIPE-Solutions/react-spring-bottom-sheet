import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
const require = createRequire(import.meta.url)
const playwrightCli = require.resolve('@playwright/test/cli')
const releaseReporter = join(
  repositoryRoot,
  'scripts',
  'playwright-release-reporter.mjs',
)
const browserMatrixUrl = pathToFileURL(
  join(repositoryRoot, 'scripts', 'browser-matrix.mjs'),
).href

const environmentWithCi = (ci) => {
  const env = { ...process.env, FORCE_COLOR: '0' }
  if (ci) env.CI = 'true'
  else delete env.CI
  return env
}

const probeConfigPolicy = ({ configPath, suite, ci }) => {
  const configUrl = pathToFileURL(configPath).href
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      [
        `import config from ${JSON.stringify(configUrl)}`,
        `import { validatePlaywrightReleaseConfig } from ${JSON.stringify(browserMatrixUrl)}`,
        `const errors = validatePlaywrightReleaseConfig({ config, suite: ${JSON.stringify(suite)} })`,
        'process.stdout.write(JSON.stringify(errors))',
      ].join('\n'),
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: environmentWithCi(ci),
    },
  )

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  return JSON.parse(result.stdout)
}

const reporterConfigSource = ({ reporterExpression, suite }) => {
  const projectNamesForSuite =
    suite === 'library'
      ? ['chromium', 'firefox', 'webkit', 'chromium-touch']
      : ['chromium', 'firefox', 'webkit']

  return [
    "import { defineConfig } from '@playwright/test'",
    '',
    `const releaseReporter = ${JSON.stringify(releaseReporter)}`,
    '',
    'export default defineConfig({',
    `  testDir: ${JSON.stringify(suite === 'library' ? './e2e' : './e2e/website')},`,
    ...(suite === 'library' ? ["  testIgnore: 'website/**',"] : []),
    ...(reporterExpression ? [`  reporter: ${reporterExpression},`] : []),
    '  projects: [',
    ...projectNamesForSuite.map((name) => `    { name: '${name}' },`),
    '  ],',
    '})',
    '',
  ].join('\n')
}

const probeReporterPolicy = ({ reporterExpression, suite }) => {
  const directory = mkdtempSync(join(repositoryRoot, '.playwright-reporter-'))
  const configPath = join(directory, 'playwright.config.mjs')
  writeFileSync(configPath, reporterConfigSource({ reporterExpression, suite }))

  try {
    return {
      ci: probeConfigPolicy({ configPath, suite, ci: true }),
      local: probeConfigPolicy({ configPath, suite, ci: false }),
    }
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

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
    libraryConfig,
    libraryProjects,
    websiteConfig,
    websiteProjects,
    releaseTests,
    ...overrides,
  })

const withProjectSetting = (config, projectName, setting) => ({
  ...config,
  projects: config.projects?.map((project) =>
    project.name === projectName ? { ...project, ...setting } : project,
  ),
})

const probeProjectSelectionBypass = async (suite) => {
  const directory = mkdtempSync(join(repositoryRoot, '.playwright-selection-'))
  const testDir = suite === 'library' ? './e2e' : './e2e/website'
  const testsDirectory = join(directory, testDir)
  const configPath = join(directory, 'playwright.config.mjs')
  const projectNamesForSuite =
    suite === 'library'
      ? ['chromium', 'firefox', 'webkit', 'chromium-touch']
      : ['chromium', 'firefox', 'webkit']
  mkdirSync(testsDirectory, { recursive: true })
  writeFileSync(
    configPath,
    [
      "import { defineConfig } from '@playwright/test'",
      '',
      'export default defineConfig({',
      `  testDir: ${JSON.stringify(testDir)},`,
      ...(suite === 'library' ? ["  testIgnore: 'website/**',"] : []),
      "  outputDir: './output',",
      `  reporter: [[${JSON.stringify(releaseReporter)}], ['list']],`,
      '  projects: [',
      ...projectNamesForSuite.map((name) =>
        name === 'webkit'
          ? "    { name: 'webkit', grepInvert: /@release:target/ },"
          : `    { name: ${JSON.stringify(name)} },`,
      ),
      '  ],',
      '})',
      '',
    ].join('\n'),
  )
  writeFileSync(
    join(testsDirectory, 'selection.spec.mjs'),
    [
      "import { test } from '@playwright/test'",
      '',
      "test('target', { tag: '@release:target' }, async () => {})",
      "test('ordinary control', async () => {})",
      '',
    ].join('\n'),
  )

  try {
    const discovered = discoverReleaseTests({ config: configPath, suite })
    const execution = spawnSync(
      process.execPath,
      [playwrightCli, 'test', '--config', configPath, '--project=webkit'],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: { ...process.env, CI: '', FORCE_COLOR: '0' },
      },
    )
    const config = (await import(pathToFileURL(configPath).href)).default
    const errors = validate({
      ...(suite === 'library'
        ? {
            libraryConfig: config,
            libraryProjects: projectNames(config),
          }
        : {
            websiteConfig: config,
            websiteProjects: projectNames(config),
          }),
      releaseTests: discovered,
      scenarioRegistry: { target: { suite } },
    })

    return { discovered, errors, execution }
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

const probeGlobalShardBypass = async (suite) => {
  const directory = mkdtempSync(join(repositoryRoot, '.playwright-shard-'))
  const testDir = suite === 'library' ? './e2e' : './e2e/website'
  const testsDirectory = join(directory, testDir)
  const configPath = join(directory, 'playwright.config.mjs')
  const unshardedConfigPath = join(directory, 'playwright.unsharded.config.mjs')
  const projectNamesForSuite =
    suite === 'library'
      ? ['chromium', 'firefox', 'webkit', 'chromium-touch']
      : ['chromium', 'firefox', 'webkit']
  const configSource = (sharded) =>
    [
      "import { defineConfig } from '@playwright/test'",
      '',
      'export default defineConfig({',
      `  testDir: ${JSON.stringify(testDir)},`,
      ...(suite === 'library' ? ["  testIgnore: 'website/**',"] : []),
      "  outputDir: './output',",
      '  fullyParallel: true,',
      `  reporter: [[${JSON.stringify(releaseReporter)}], ['list']],`,
      ...(sharded ? ['  shard: { current: 1, total: 2 },'] : []),
      '  projects: [',
      ...projectNamesForSuite.map((name) => `    { name: '${name}' },`),
      '  ],',
      '})',
      '',
    ].join('\n')

  mkdirSync(testsDirectory, { recursive: true })
  writeFileSync(configPath, configSource(true))
  writeFileSync(unshardedConfigPath, configSource(false))
  writeFileSync(
    join(testsDirectory, 'shard.spec.mjs'),
    [
      "import { test } from '@playwright/test'",
      '',
      "for (const title of ['first', 'second']) {",
      "  test(title, { tag: '@release:target' }, async () => {})",
      '}',
      '',
    ].join('\n'),
  )

  try {
    const allDiscovered = discoverReleaseTests({
      config: unshardedConfigPath,
      suite,
    })
    const discovered = discoverReleaseTests({ config: configPath, suite })
    const execution = spawnSync(
      process.execPath,
      [playwrightCli, 'test', '--config', configPath, '--project=chromium'],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: environmentWithCi(false),
      },
    )
    const importedConfig = (await import(pathToFileURL(configPath).href))
      .default

    return {
      allDiscovered,
      discovered,
      errors: validate({
        ...(suite === 'library'
          ? {
              libraryConfig: importedConfig,
              libraryProjects: projectNames(importedConfig),
            }
          : {
              websiteConfig: importedConfig,
              websiteProjects: projectNames(importedConfig),
            }),
        releaseTests: discovered,
        scenarioRegistry: { target: { suite } },
      }),
      execution,
    }
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

test('accepts the configured browser projects and registered release tests', () => {
  assert.deepEqual(validate(), [])
})

for (const [suite, configPath] of [
  ['library', join(repositoryRoot, 'playwright.config.ts')],
  ['website', join(repositoryRoot, 'playwright.website.config.ts')],
]) {
  for (const [environment, ci] of [
    ['with CI unset', false],
    ['with CI=true', true],
  ]) {
    test(`accepts the real ${suite} config ${environment}`, () => {
      assert.deepEqual(probeConfigPolicy({ configPath, suite, ci }), [])
    })
  }

  const reporterError = `${suite} config reporter must be exactly the release reporter followed by list or github`
  for (const [mutation, reporterExpression, expected] of [
    [
      'with the release reporter only in CI',
      "process.env.CI ? [[releaseReporter], ['github']] : [['list']]",
      { ci: [], local: [reporterError] },
    ],
    [
      'with the release reporter only outside CI',
      "process.env.CI ? [['github']] : [[releaseReporter], ['list']]",
      { ci: [reporterError], local: [] },
    ],
    [
      'without a reporter',
      undefined,
      { ci: [reporterError], local: [reporterError] },
    ],
    [
      'with the release reporter replaced',
      "[[`${releaseReporter}.replacement`], [process.env.CI ? 'github' : 'list']]",
      { ci: [reporterError], local: [reporterError] },
    ],
  ]) {
    test(`rejects a real ${suite} config ${mutation}`, () => {
      assert.deepEqual(
        probeReporterPolicy({ reporterExpression, suite }),
        expected,
      )
    })
  }
}

for (const suite of ['library', 'website']) {
  test(`rejects a project-level grepInvert that omits ${suite} release evidence from WebKit`, async () => {
    const { discovered, errors, execution } =
      await probeProjectSelectionBypass(suite)
    const output = `${execution.stdout}\n${execution.stderr}`

    assert.deepEqual(
      discovered.map(({ scenario, projectName }) => ({
        scenario,
        projectName,
      })),
      [{ scenario: 'target', projectName: 'chromium' }],
    )
    assert.equal(execution.status, 0, output)
    assert.doesNotMatch(output, /release test execution policy/i)
    assert.deepEqual(errors, [
      `${suite} project webkit must not configure release-test selection: grepInvert`,
    ])
  })

  test(`rejects global sharding that omits a same-site parameterized ${suite} release instance`, async () => {
    const { allDiscovered, discovered, errors, execution } =
      await probeGlobalShardBypass(suite)
    const output = `${execution.stdout}\n${execution.stderr}`

    assert.equal(allDiscovered.length, 2)
    assert.equal(discovered.length, 1)
    assert.equal(
      new Set(
        allDiscovered.map(
          ({ file, line, column }) => `${file}:${line}:${column}`,
        ),
      ).size,
      1,
    )
    assert.equal(execution.status, 0, output)
    assert.doesNotMatch(output, /release test execution policy/i)
    assert.deepEqual(errors, [
      `${suite} config must not configure release-test selection: shard`,
    ])
  })
}

for (const [suite, configKey, config] of [
  ['library', 'libraryConfig', libraryConfig],
  ['website', 'websiteConfig', websiteConfig],
]) {
  for (const [control, value] of [
    ['grep', /@release:modal-focus-isolation/],
    ['grepInvert', /@release:/],
    ['testMatch', '**/one-release-test.spec.ts'],
    ['respectGitIgnore', true],
    ['shard', { current: 1, total: 2 }],
  ]) {
    test(`rejects ${suite} global ${control} release-test selection`, () => {
      assert.deepEqual(
        validate({ [configKey]: { ...config, [control]: value } }),
        [
          `${suite} config must not configure release-test selection: ${control}`,
        ],
      )
    })
  }

  for (const [control, value] of [
    ['grep', /@release:modal-focus-isolation/],
    ['grepInvert', /@release:/],
    ['testMatch', '**/one-release-test.spec.ts'],
    ['testIgnore', '**/*'],
    ['testDir', './empty-tests'],
    ['dependencies', ['setup']],
    ['respectGitIgnore', true],
    ['shard', { current: 1, total: 2 }],
    ['teardown', 'cleanup'],
  ]) {
    test(`rejects ${suite} WebKit project ${control} selection`, () => {
      assert.deepEqual(
        validate({
          [configKey]: withProjectSetting(config, 'webkit', {
            [control]: value,
          }),
        }),
        [
          `${suite} project webkit must not configure release-test selection: ${control}`,
        ],
      )
    })
  }
}

test('requires the canonical library test directory and website exclusion', () => {
  assert.deepEqual(
    validate({
      libraryConfig: {
        ...libraryConfig,
        testDir: './e2e/library-only',
        testIgnore: ['website/**', '**/sheet-interactions.spec.ts'],
      },
    }),
    [
      'library config testDir must be exactly ./e2e',
      'library config testIgnore must be exactly website/**',
    ],
  )
})

test('requires the canonical website test directory without exclusions', () => {
  assert.deepEqual(
    validate({
      websiteConfig: {
        ...websiteConfig,
        testDir: './e2e',
        testIgnore: '**/recipes.spec.ts',
      },
    }),
    [
      'website config testDir must be exactly ./e2e/website',
      'website config must not configure release-test selection: testIgnore',
    ],
  )
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
