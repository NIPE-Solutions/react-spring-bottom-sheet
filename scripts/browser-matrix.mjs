const desktopProjects = ['chromium', 'firefox', 'webkit']

export const releaseScenarios = Object.freeze([
  'modal-focus-isolation',
  'non-modal-interaction',
  'mouse-drag',
  'touch-drag',
  'flick-settling',
  'pointer-cancellation',
  'motion-interruption',
  'nested-scroll',
  'handle-only-drag',
  'viewport-resize',
  'content-resize',
  'reduced-motion',
  'custom-portal',
  'narrow-layout',
  'website-accessibility',
])

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

const missingFrom = (required, actual) => {
  const available = new Set(actual)
  return required.filter((item) => !available.has(item))
}

export function validateBrowserMatrix({
  libraryProjects,
  websiteProjects,
  scenarios,
}) {
  const errors = []
  const missingLibraryProjects = missingFrom(
    [...desktopProjects, 'chromium-touch'],
    libraryProjects,
  )
  const missingWebsiteProjects = missingFrom(desktopProjects, websiteProjects)
  const missingScenarios = missingFrom(releaseScenarios, scenarios)

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

  return Object.freeze(errors)
}
