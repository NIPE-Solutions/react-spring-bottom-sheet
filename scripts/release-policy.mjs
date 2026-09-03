import { parse as parseYaml } from 'yaml'

const withoutComments = (source) =>
  source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')

const topLevelBlock = (source, name) => {
  const lines = source.split('\n')
  const start = lines.findIndex((line) => line === `${name}:`)
  if (start === -1) return ''

  const end = lines.findIndex(
    (line, index) => index > start && /^\S.*:$/.test(line),
  )
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n')
}

const jobsIn = (workflow) => {
  const jobs = topLevelBlock(workflow, 'jobs')
  const matches = [...jobs.matchAll(/^ {2}([\w-]+):\s*$/gm)]

  return matches.map((match, index) => ({
    name: match[1],
    source: jobs.slice(
      match.index + match[0].length,
      matches[index + 1]?.index ?? jobs.length,
    ),
  }))
}

const stepsIn = (job) => {
  const matches = [...job.source.matchAll(/^ {6}- /gm)]

  return matches.map((match, index) => ({
    source: job.source.slice(
      match.index,
      matches[index + 1]?.index ?? job.source.length,
    ),
  }))
}

const jobSettings = (job) => {
  const firstStep = job.source.search(/^ {6}- /m)
  return job.source.slice(0, firstStep === -1 ? undefined : firstStep)
}

const mappingBlock = (source, name, indent) => {
  const lines = source.split('\n')
  const start = lines.findIndex(
    (line) => line === `${' '.repeat(indent)}${name}:`,
  )
  if (start === -1) return []

  const end = lines.findIndex(
    (line, index) =>
      index > start && line.trim() !== '' && line.search(/\S/) <= indent,
  )
  return lines.slice(start + 1, end === -1 ? undefined : end)
}

const runContent = (step) => {
  const lines = step.source.split('\n')
  const inlineRun = lines.find((line) => /^ {6}- run:/.test(line))
  if (inlineRun) return inlineRun.replace(/^ {6}- run:\s*/, '')

  const runIndex = lines.findIndex((line) => /^ {8}run:/.test(line))
  if (runIndex === -1) return ''

  const value = lines[runIndex].replace(/^ {8}run:\s*/, '')
  if (value !== '|' && value !== '>') return value

  const content = []
  for (const line of lines.slice(runIndex + 1)) {
    if (line.trim() !== '' && line.search(/\S/) <= 8) break
    content.push(line)
  }
  return content.join('\n')
}

const commandLines = (step) =>
  runContent(step)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))

const isMapping = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const mappingValue = (mapping, name) =>
  isMapping(mapping) && Object.hasOwn(mapping, name) ? mapping[name] : undefined

const scalarValue = (mapping, name) => {
  const value = mappingValue(mapping, name)
  return value === undefined ? '' : String(value).trim()
}

const sequenceValue = (value) => {
  if (value === undefined) return []
  const values = Array.isArray(value) ? value : [value]
  return values.map((entry) => String(entry).trim())
}

const runCommands = (step) => {
  const run = mappingValue(step, 'run')
  if (run === undefined) return []

  return [String(run).trim()]
}

export function parseWorkflowModel(workflow) {
  const document = parseYaml(workflow)
  const jobs = mappingValue(document, 'jobs')
  if (!isMapping(jobs)) return []
  const workflowDefaults = mappingValue(document, 'defaults')
  const workflowRunDefaults = mappingValue(workflowDefaults, 'run')
  const workflowShell = scalarValue(workflowRunDefaults, 'shell')

  return Object.entries(jobs).map(([name, value]) => {
    const job = isMapping(value) ? value : {}
    const jobDefaults = mappingValue(job, 'defaults')
    const jobRunDefaults = mappingValue(jobDefaults, 'run')
    const strategy = mappingValue(job, 'strategy')
    const matrix = mappingValue(strategy, 'matrix')
    const matrixMapping = isMapping(matrix) ? matrix : {}
    const steps = mappingValue(job, 'steps')

    return {
      name,
      needs: sequenceValue(mappingValue(job, 'needs')),
      runsOn: scalarValue(job, 'runs-on'),
      if: scalarValue(job, 'if'),
      continueOnError: scalarValue(job, 'continue-on-error'),
      workflowShell,
      defaultShell: scalarValue(jobRunDefaults, 'shell'),
      matrix: {
        keys: Object.keys(matrixMapping),
        project: sequenceValue(mappingValue(matrixMapping, 'project')),
      },
      steps: (Array.isArray(steps) ? steps : []).map((value) => {
        const step = isMapping(value) ? value : {}
        return {
          commands: runCommands(step),
          if: scalarValue(step, 'if'),
          continueOnError: scalarValue(step, 'continue-on-error'),
          shell: scalarValue(step, 'shell'),
        }
      }),
    }
  })
}

const hasPublishCommand = (step) =>
  commandLines(step).some(
    (line) =>
      line === 'run: npm publish --access public --tag "$CHANNEL"' ||
      line === 'npm publish --access public --tag "$CHANNEL"',
  )

const hasImmutableVersionCheck = (step) => {
  const lines = commandLines(step)
  const checkIndex = lines.findIndex((line) =>
    /^if npm view "\$NAME@\$VERSION" version[^;]*; then$/.test(line),
  )

  return (
    checkIndex !== -1 &&
    lines.slice(checkIndex + 1).some((line) => line === 'exit 1') &&
    lines.slice(checkIndex + 1).some((line) => line === 'fi')
  )
}

const hasBoundedRegistryVerification = (step) => {
  const content = runContent(step)
  const attempts = content.match(/MAX_ATTEMPTS=([1-9][0-9]*)(?:\n|$)/)
  const delay = content.match(/RETRY_DELAY_SECONDS=([1-9][0-9]*)(?:\n|$)/)

  return (
    attempts !== null &&
    delay !== null &&
    Number(attempts[1]) * Number(delay[1]) <= 300 &&
    /while test "\$attempt" -le "\$MAX_ATTEMPTS"; do/.test(content) &&
    /sleep "\$RETRY_DELAY_SECONDS"/.test(content) &&
    /attempt=\$\(\(attempt \+ 1\)\)/.test(content) &&
    /Registry verification failed[^\n]*\n\s*exit 1/.test(content)
  )
}

const hasRegistryVerification = (step) => {
  const content = runContent(step)

  return (
    /PUBLISHED_VERSION=\$\(npm view "\$NAME@\$VERSION" version/.test(content) &&
    /CHANNEL_VERSION=\$\(npm view "\$NAME@\$CHANNEL" version/.test(content) &&
    /test "\$PUBLISHED_VERSION" = "\$VERSION"/.test(content) &&
    /test "\$CHANNEL_VERSION" = "\$VERSION"/.test(content)
  )
}

const hasBoundedRegistryNetwork = (step) => {
  const content = runContent(step)
  const attempts = content.match(/MAX_ATTEMPTS=([1-9][0-9]*)(?:\n|$)/)
  const delay = content.match(/RETRY_DELAY_SECONDS=([1-9][0-9]*)(?:\n|$)/)
  const timeout = content.match(/FETCH_TIMEOUT_MS=([1-9][0-9]*)(?:\n|$)/)
  const publishedLookup =
    /PUBLISHED_VERSION=\$\(npm view "\$NAME@\$VERSION" version --fetch-timeout="\$FETCH_TIMEOUT_MS" --fetch-retries=0[^\n]*\)/
  const channelLookup =
    /CHANNEL_VERSION=\$\(npm view "\$NAME@\$CHANNEL" version --fetch-timeout="\$FETCH_TIMEOUT_MS" --fetch-retries=0[^\n]*\)/

  if (
    !attempts ||
    !delay ||
    !timeout ||
    !publishedLookup.test(content) ||
    !channelLookup.test(content)
  ) {
    return false
  }

  const attemptCount = Number(attempts[1])
  const delaySeconds = Number(delay[1])
  const timeoutSeconds = Number(timeout[1]) / 1000
  const maximumSeconds =
    attemptCount * 2 * timeoutSeconds + (attemptCount - 1) * delaySeconds

  return Number.isInteger(timeoutSeconds) && maximumSeconds <= 300
}

const channelInput = (workflow) => {
  const on = topLevelBlock(workflow, 'on')
  const lines = on.split('\n')
  const start = lines.findIndex((line) => line === '      channel:')
  if (start === -1) return []

  const end = lines.findIndex(
    (line, index) => index > start && /^ {6}[\w-]+:$/.test(line),
  )
  return lines.slice(start + 1, end === -1 ? undefined : end)
}

const channelChoices = (input) => {
  const options = mappingBlock(input.join('\n'), 'options', 8)
  return options.flatMap((line) => {
    const match = line.match(/^ {10}- ([^\s#]+)\s*$/)
    return match ? [match[1]] : []
  })
}

export function validateReleasePolicy({ packageJson, workflow }) {
  const errors = []
  const source = withoutComments(workflow)
  const on = topLevelBlock(source, 'on')
  const triggers = [...on.matchAll(/^ {2}([\w-]+):/gm)].map((match) => match[1])
  const input = channelInput(source)
  const channels = channelChoices(input)
  const publishJob = jobsIn(source).find((job) =>
    stepsIn(job).some(hasPublishCommand),
  )

  if (triggers.length !== 1 || triggers[0] !== 'workflow_dispatch') {
    errors.push('release workflow must be manual')
  }
  if (
    !input.includes('        type: choice') ||
    channels.length !== 2 ||
    channels[0] !== 'next' ||
    channels[1] !== 'latest'
  ) {
    errors.push('release channels must be exactly next and latest')
  }
  if (!publishJob) {
    errors.push('publish must use the requested protected channel')
  } else {
    const steps = stepsIn(publishJob)
    const settings = jobSettings(publishJob)
    const publishIndex = steps.findIndex(hasPublishCommand)
    const releaseIndex = steps.findIndex((step) =>
      commandLines(step).some((line) => line.startsWith('gh release create ')),
    )
    const immutableIndex = steps.findIndex(hasImmutableVersionCheck)
    const registryIndex = steps.findIndex(hasRegistryVerification)
    const registryRetryIndex = steps.findIndex(hasBoundedRegistryVerification)
    const registryNetworkIndex = steps.findIndex(hasBoundedRegistryNetwork)
    const packageVersionIndex = steps.findIndex((step) =>
      commandLines(step).includes(
        'PACKAGE_VERSION=$(node -p "require(\'./package.json\').version")',
      ),
    )
    const versionMatchIndex = steps.findIndex((step) =>
      commandLines(step).includes('test "$PACKAGE_VERSION" = "$VERSION"'),
    )

    if (!/^ {4}environment: npm$/m.test(settings)) {
      errors.push('publish job must use the npm environment')
    }
    if (
      !mappingBlock(settings, 'permissions', 4).includes(
        '      id-token: write',
      )
    ) {
      errors.push('publish job must request OIDC')
    }
    if (
      packageVersionIndex === -1 ||
      (versionMatchIndex !== -1 && packageVersionIndex !== versionMatchIndex)
    ) {
      errors.push('package version must be read from package.json')
    }
    if (versionMatchIndex === -1) {
      errors.push('requested version must match package.json')
    }
    if (immutableIndex === -1 || immutableIndex >= publishIndex) {
      errors.push('published versions must be immutable')
    }
    if (
      !/if test "\$CHANNEL" = "latest"; then\s*[\s\S]*?case "\$VERSION" in\s+\*-\*\) exit 1 ;; esac/.test(
        runContent(steps[packageVersionIndex] ?? { source: '' }),
      )
    ) {
      errors.push('latest must reject prerelease versions')
    }
    if (
      !/else\s+case "\$VERSION" in\s+\*-\*\) ;; \*\) exit 1 ;; esac/.test(
        runContent(steps[packageVersionIndex] ?? { source: '' }),
      )
    ) {
      errors.push('next must require prerelease versions')
    }
    if (
      !/test "\$GITHUB_REF_NAME" = "main"/.test(
        runContent(steps[packageVersionIndex] ?? { source: '' }),
      )
    ) {
      errors.push('latest releases must come from main')
    }
    if (registryIndex === -1) {
      errors.push('registry verification must confirm the requested version')
    } else {
      if (registryIndex <= publishIndex) {
        errors.push('registry verification must follow publication')
      }
      if (releaseIndex <= registryIndex) {
        errors.push('registry verification must precede release creation')
      }
    }
    if (registryRetryIndex !== registryIndex) {
      errors.push('registry verification must retry with a bounded delay')
    }
    if (registryNetworkIndex !== registryIndex) {
      errors.push('registry verification must use bounded network timeouts')
    }
  }

  if (/NODE_AUTH_TOKEN|NPM_TOKEN/.test(source)) {
    errors.push('release workflow must not use long-lived npm tokens')
  }
  if (!/^ {4}needs: verify$/m.test(jobSettings(publishJob ?? { source: '' }))) {
    errors.push('verification must precede publication')
  }
  if (packageJson.publishConfig?.access !== 'public') {
    errors.push('package must publish with public access')
  }
  if (packageJson.publishConfig?.provenance !== true) {
    errors.push('package must publish with provenance')
  }
  return errors
}
