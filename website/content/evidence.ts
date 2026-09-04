export interface BuildEvidence {
  version: string
  moduleGzipBytes: number
  browserEngines: readonly ['Chromium', 'Firefox', 'WebKit']
  reactRange: string
}

export const buildEvidence = {
  version: '5.0.1',
  moduleGzipBytes: 8213,
  browserEngines: ['Chromium', 'Firefox', 'WebKit'],
  reactRange: '^19.0.0',
} as const satisfies BuildEvidence
