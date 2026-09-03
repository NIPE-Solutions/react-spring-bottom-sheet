const isReleaseTest = (testCase) =>
  testCase.tags.some((tag) => tag.startsWith('@release:'))

export function releaseTestViolation(testCase) {
  if (!isReleaseTest(testCase)) return null

  if (testCase.expectedStatus !== 'passed') {
    return `expected ${testCase.expectedStatus} instead of passed`
  }

  const blockingAnnotation = testCase.annotations.find(({ type }) =>
    ['skip', 'fixme', 'fail'].includes(type),
  )
  if (blockingAnnotation) {
    return `carried a ${blockingAnnotation.type} annotation`
  }

  if (testCase.results.length === 0) {
    return 'did not produce an execution result'
  }

  const nonPassingResult = testCase.results.find(
    ({ status }) => status !== 'passed',
  )
  if (nonPassingResult) {
    return `finished with ${nonPassingResult.status ?? 'no status'} instead of passed`
  }

  const outcome = testCase.outcome()
  if (outcome !== 'expected') {
    return `had ${outcome} instead of expected outcome`
  }

  return null
}

const testLabel = (testCase) => {
  const title = testCase.titlePath().filter(Boolean).join(' › ')
  const { file, line } = testCase.location
  return `${title} (${file}:${line})`
}

export default class PlaywrightReleaseReporter {
  releaseTests = []

  onBegin(_config, suite) {
    this.releaseTests = suite.allTests().filter(isReleaseTest)
  }

  onEnd() {
    const violations = this.releaseTests.flatMap((testCase) => {
      const violation = releaseTestViolation(testCase)
      return violation ? [`${testLabel(testCase)}: ${violation}`] : []
    })

    if (violations.length === 0) return undefined

    process.stderr.write(
      [
        '',
        'Release test execution policy failed:',
        ...violations.map((violation) => `  - ${violation}`),
        '',
      ].join('\n'),
    )
    return { status: 'failed' }
  }
}
