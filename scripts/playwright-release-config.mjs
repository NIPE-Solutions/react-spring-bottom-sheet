import { fileURLToPath } from 'node:url'

export const releaseReporterPath = fileURLToPath(
  new URL('./playwright-release-reporter.mjs', import.meta.url),
)

export function releaseReporters(consoleReporter) {
  return [[releaseReporterPath], [consoleReporter]]
}
