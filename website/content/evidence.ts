export interface BuildEvidence {
  version: string
  moduleGzipBytes: number
  browserEngines: readonly ['Chromium', 'Firefox', 'WebKit']
  reactRange: string
}

export const buildEvidence = {
  version: '5.0.0-alpha.0',
  moduleGzipBytes: 10460,
  browserEngines: ['Chromium', 'Firefox', 'WebKit'],
  reactRange: '^19.0.0',
} as const satisfies BuildEvidence
