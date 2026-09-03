import { releaseReporterPath } from './playwright-release-config.mjs'

const desktopProjects = ['chromium', 'firefox', 'webkit']
const requiredLibraryProjects = [...desktopProjects, 'chromium-touch']
const nonExecutingAnnotations = new Set(['skip', 'fixme', 'fail'])
const globalSelectionContract = Object.freeze({
  grep: undefined,
  grepInvert: undefined,
  respectGitIgnore: undefined,
  shard: undefined,
  testMatch: undefined,
})
const projectSelectionContract = Object.freeze({
  ...globalSelectionContract,
  dependencies: undefined,
  teardown: undefined,
  testDir: undefined,
  testIgnore: undefined,
})
const releaseConfigContracts = Object.freeze({
  library: Object.freeze({
    projects: requiredLibraryProjects,
    testDir: './e2e',
    testIgnore: 'website/**',
  }),
  website: Object.freeze({
    projects: desktopProjects,
    testDir: './e2e/website',
    testIgnore: undefined,
  }),
})

export const releaseScenarioRegistry = Object.freeze({
  'modal-focus-isolation': { suite: 'library' },
  'non-modal-interaction': { suite: 'website' },
  'mouse-drag': { suite: 'library' },
  'touch-drag': { suite: 'library' },
  'flick-settling': { suite: 'library' },
  'pointer-cancellation': { suite: 'library' },
  'motion-interruption': { suite: 'library' },
  'nested-scroll': { suite: 'library' },
  'handle-only-drag': { suite: 'library' },
  'viewport-resize': { suite: 'library' },
  'content-resize': { suite: 'website' },
  'reduced-motion': { suite: 'website' },
  'custom-portal': { suite: 'website' },
  'narrow-layout': { suite: 'website' },
  'website-accessibility': { suite: 'website' },
})

export const releaseScenarios = Object.freeze(
  Object.keys(releaseScenarioRegistry),
)

const missingFrom = (required, actual) => {
  const available = new Set(actual)
  return required.filter((item) => !available.has(item))
}

const configuredOutsideContract = (config, contract) =>
  Object.entries(contract)
    .filter(([control, allowedValue]) => config?.[control] !== allowedValue)
    .map(([control]) => control)

const hasRequiredReporterConfig = (reporter) =>
  Array.isArray(reporter) &&
  reporter.length === 2 &&
  Array.isArray(reporter[0]) &&
  reporter[0].length === 1 &&
  reporter[0][0] === releaseReporterPath &&
  Array.isArray(reporter[1]) &&
  reporter[1].length === 1 &&
  ['github', 'list'].includes(reporter[1][0])

export function validatePlaywrightReleaseConfig({ config, suite }) {
  const errors = []
  const contract = releaseConfigContracts[suite]

  if (config?.testDir !== contract.testDir) {
    errors.push(`${suite} config testDir must be exactly ${contract.testDir}`)
  }

  const globalControls = configuredOutsideContract(
    config,
    globalSelectionContract,
  )
  if (globalControls.length > 0) {
    errors.push(
      `${suite} config must not configure release-test selection: ${globalControls.join(', ')}`,
    )
  }

  if (contract.testIgnore === undefined) {
    if (config?.testIgnore !== undefined) {
      errors.push(
        `${suite} config must not configure release-test selection: testIgnore`,
      )
    }
  } else if (config?.testIgnore !== contract.testIgnore) {
    errors.push(
      `${suite} config testIgnore must be exactly ${contract.testIgnore}`,
    )
  }

  if (!hasRequiredReporterConfig(config?.reporter)) {
    errors.push(
      `${suite} config reporter must be exactly the release reporter followed by list or github`,
    )
  }

  for (const projectName of contract.projects) {
    const project = config?.projects?.find(({ name }) => name === projectName)
    const controls = configuredOutsideContract(
      project,
      projectSelectionContract,
    )
    if (controls.length > 0) {
      errors.push(
        `${suite} project ${projectName} must not configure release-test selection: ${controls.join(', ')}`,
      )
    }
  }

  return Object.freeze(errors)
}

export function validateBrowserMatrix({
  libraryConfig,
  libraryProjects,
  websiteConfig,
  websiteProjects,
  releaseTests,
  scenarioRegistry = releaseScenarioRegistry,
}) {
  const errors = []
  const expectedScenarios = Object.keys(scenarioRegistry)
  const testsByScenario = new Map()

  errors.push(
    ...validatePlaywrightReleaseConfig({
      config: libraryConfig,
      suite: 'library',
    }),
    ...validatePlaywrightReleaseConfig({
      config: websiteConfig,
      suite: 'website',
    }),
  )

  for (const releaseTest of releaseTests) {
    const tests = testsByScenario.get(releaseTest.scenario) ?? []
    tests.push(releaseTest)
    testsByScenario.set(releaseTest.scenario, tests)
  }

  const missingLibraryProjects = missingFrom(
    requiredLibraryProjects,
    libraryProjects,
  )
  const missingWebsiteProjects = missingFrom(desktopProjects, websiteProjects)
  const missingScenarios = missingFrom(
    expectedScenarios,
    testsByScenario.keys(),
  )

  if (missingLibraryProjects.length > 0) {
    errors.push(
      `library projects missing: ${missingLibraryProjects.join(', ')}`,
    )
  }
  if (missingWebsiteProjects.length > 0) {
    errors.push(
      `website projects missing: ${missingWebsiteProjects.join(', ')}`,
    )
  }
  if (missingScenarios.length > 0) {
    errors.push(`release scenarios missing: ${missingScenarios.join(', ')}`)
  }

  const disabledScenarios = [
    ...new Set(
      releaseTests
        .filter(
          ({ expectedStatus, annotations = [] }) =>
            expectedStatus !== 'passed' ||
            annotations.some(({ type }) => nonExecutingAnnotations.has(type)),
        )
        .map(({ scenario }) => scenario),
    ),
  ]
  if (disabledScenarios.length > 0) {
    errors.push(
      `release scenarios must execute normally: ${disabledScenarios.join(', ')}`,
    )
  }

  for (const scenario of expectedScenarios) {
    const releaseScenarioTests = testsByScenario.get(scenario) ?? []
    const expectedSuite = scenarioRegistry[scenario].suite
    const actualSuites = [
      ...new Set(releaseScenarioTests.map(({ suite }) => suite)),
    ]

    if (
      actualSuites.length > 0 &&
      (actualSuites.length !== 1 || actualSuites[0] !== expectedSuite)
    ) {
      errors.push(
        `release scenario ${scenario} expected ${expectedSuite} but was registered in ${actualSuites.join(', ')}`,
      )
    }
  }

  const duplicateScenarios = expectedScenarios.filter((scenario) => {
    const registrationSites = new Set(
      (testsByScenario.get(scenario) ?? []).map(
        ({ suite, file, line, column }) => `${suite}:${file}:${line}:${column}`,
      ),
    )
    return registrationSites.size > 1
  })
  if (duplicateScenarios.length > 0) {
    errors.push(
      `release scenarios registered at multiple sites: ${duplicateScenarios.join(', ')}`,
    )
  }

  const unknownScenarios = [
    ...new Set(
      releaseTests
        .map(({ scenario }) => scenario)
        .filter((scenario) => !Object.hasOwn(scenarioRegistry, scenario)),
    ),
  ]
  if (unknownScenarios.length > 0) {
    errors.push(
      `unknown release scenarios registered: ${unknownScenarios.join(', ')}`,
    )
  }

  return Object.freeze(errors)
}
