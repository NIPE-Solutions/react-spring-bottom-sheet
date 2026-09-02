import assert from 'node:assert/strict'
import test from 'node:test'

import libraryConfig from '../playwright.config.ts'
import websiteConfig from '../playwright.website.config.ts'
import {
  releaseScenarioRegistry,
  releaseScenarios,
  validateBrowserMatrix,
} from './browser-matrix.mjs'

const projectNames = (config) =>
  config.projects?.map((project) => project.name).filter(Boolean) ?? []

const libraryProjects = projectNames(libraryConfig)
const websiteProjects = projectNames(websiteConfig)
const scenarios = Object.keys(releaseScenarioRegistry)

test('accepts the configured browser projects and release scenario inventory', () => {
  assert.deepEqual(
    validateBrowserMatrix({
      libraryProjects,
      websiteProjects,
      scenarios,
    }),
    [],
  )
})

for (const project of ['chromium', 'firefox', 'webkit']) {
  test(`requires ${project} in both browser suites`, () => {
    const withoutProject = (projects) =>
      projects.filter((candidate) => candidate !== project)

    assert.deepEqual(
      validateBrowserMatrix({
        libraryProjects: withoutProject(libraryProjects),
        websiteProjects: withoutProject(websiteProjects),
        scenarios,
      }),
      [
        `library projects missing: ${project}`,
        `website projects missing: ${project}`,
      ],
    )
  })
}

test('requires the Chromium touch project for library gestures only', () => {
  assert.deepEqual(
    validateBrowserMatrix({
      libraryProjects: libraryProjects.filter(
        (project) => project !== 'chromium-touch',
      ),
      websiteProjects,
      scenarios,
    }),
    ['library projects missing: chromium-touch'],
  )
})

for (const scenario of releaseScenarios) {
  test(`requires the ${scenario} release scenario`, () => {
    assert.deepEqual(
      validateBrowserMatrix({
        libraryProjects,
        websiteProjects,
        scenarios: scenarios.filter((candidate) => candidate !== scenario),
      }),
      [`release scenarios missing: ${scenario}`],
    )
  })
}

test('aggregates every missing project and scenario', () => {
  assert.deepEqual(
    validateBrowserMatrix({
      libraryProjects: [],
      websiteProjects: [],
      scenarios: [],
    }),
    [
      'library projects missing: chromium, firefox, webkit, chromium-touch',
      'website projects missing: chromium, firefox, webkit',
      `release scenarios missing: ${releaseScenarios.join(', ')}`,
    ],
  )
})
