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

const jobDependencies = (settings) => {
  const inline = settings.match(/^ {4}needs:\s*(.+?)\s*$/m)?.[1]
  if (inline) {
    if (inline === '[]') return []
    if (inline.startsWith('[') && inline.endsWith(']')) {
      return inline
        .slice(1, -1)
        .split(',')
        .map((dependency) => dependency.trim())
        .filter(Boolean)
    }
    return [inline]
  }

  return mappingBlock(settings, 'needs', 4).flatMap((line) => {
    const match = line.match(/^ {6}- ([\w-]+)\s*$/)
    return match ? [match[1]] : []
  })
}

const scalarSetting = (settings, name) =>
  settings.match(new RegExp(`^ {4}${name}:\\s*([^\\s#]+)\\s*$`, 'm'))?.[1] ?? ''

const sequenceSetting = (source, name, indent) => {
  const prefix = ' '.repeat(indent)
  const inline = source.match(
    new RegExp(`^${prefix}${name}:\\s*\\[([^\\]]*)\\]\\s*$`, 'm'),
  )?.[1]
  if (inline !== undefined) {
    return inline
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }

  return mappingBlock(source, name, indent).flatMap((line) => {
    const match = line.match(new RegExp(`^ {${indent + 2}}- ([^\\s#]+)\\s*$`))
    return match ? [match[1]] : []
  })
}

const matrixSettings = (settings) => {
  const strategy = mappingBlock(settings, 'strategy', 4).join('\n')
  const matrix = mappingBlock(strategy, 'matrix', 6).join('\n')
  const keys = [...matrix.matchAll(/^ {8}([\w-]+):(?:\s|$)/gm)].map(
    (match) => match[1],
  )

  return { keys, project: sequenceSetting(matrix, 'project', 8) }
}

export function parseWorkflowModel(workflow) {
  return jobsIn(withoutComments(workflow)).map((job) => {
    const settings = jobSettings(job)

    return {
      name: job.name,
      needs: jobDependencies(settings),
      runsOn: scalarSetting(settings, 'runs-on'),
      matrix: matrixSettings(settings),
      steps: stepsIn(job).map((step) => ({
        commands: commandLines(step),
      })),
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
    const registryIndex = steps.findIndex((step) =>
      commandLines(step).includes(
        'test "$(npm view "$NAME@$CHANNEL" version)" = "$VERSION"',
      ),
    )
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
