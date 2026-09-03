import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const playwrightCli = require.resolve('@playwright/test/cli')
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const releaseTagPrefix = 'release:'

const specsIn = (suites) =>
  suites.flatMap((suite) => [
    ...(suite.specs ?? []),
    ...specsIn(suite.suites ?? []),
  ])

export function releaseTestsFromReport({ report, suite }) {
  return specsIn(report.suites ?? []).flatMap((spec) =>
    (spec.tests ?? []).flatMap((test) =>
      (spec.tags ?? [])
        .map((tag) => tag.replace(/^@/, ''))
        .filter((tag) => tag.startsWith(releaseTagPrefix))
        .map((tag) => ({
          scenario: tag.slice(releaseTagPrefix.length),
          suite,
          file: spec.file,
          line: spec.line,
          column: spec.column,
          title: spec.title,
          projectName: test.projectName,
          expectedStatus: test.expectedStatus,
          annotations: test.annotations ?? [],
        })),
    ),
  )
}

export function discoverReleaseTests({ config, suite }) {
  const result = spawnSync(
    process.execPath,
    [
      playwrightCli,
      'test',
      '--config',
      config,
      '--list',
      '--reporter=json',
      '--project=chromium',
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    },
  )

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(
      `Playwright could not list the ${suite} suite:\n${result.stderr || result.stdout}`,
    )
  }

  const report = JSON.parse(result.stdout)
  return releaseTestsFromReport({ report, suite })
}
