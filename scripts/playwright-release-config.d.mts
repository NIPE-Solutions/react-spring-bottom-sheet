import type { ReporterDescription } from '@playwright/test'

export const releaseReporterPath: string
export function releaseReporters(
  consoleReporter: 'github' | 'list',
): ReporterDescription[]
