const desktopProjects = ['chromium', 'firefox', 'webkit']

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

export function validateBrowserMatrix({
  libraryProjects,
  websiteProjects,
  releaseTests,
  scenarioRegistry = releaseScenarioRegistry,
}) {
  const errors = []
  const expectedScenarios = Object.keys(scenarioRegistry)
  const testsByScenario = new Map()

  for (const releaseTest of releaseTests) {
    const tests = testsByScenario.get(releaseTest.scenario) ?? []
    tests.push(releaseTest)
    testsByScenario.set(releaseTest.scenario, tests)
  }

  const missingLibraryProjects = missingFrom(
    [...desktopProjects, 'chromium-touch'],
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
        .filter((scenario) => !scenarioRegistry[scenario]),
    ),
  ]
  if (unknownScenarios.length > 0) {
    errors.push(
      `unknown release scenarios registered: ${unknownScenarios.join(', ')}`,
    )
  }

  return Object.freeze(errors)
}
