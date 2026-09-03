import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  readinessCommands,
  runReadinessCli,
  runReadinessChecks,
  validateReadinessScriptGraph,
  validateReadinessWorkflows,
} from './verify-release-readiness.mjs'
import { parseWorkflowModel } from './release-policy.mjs'

const expectedCommands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:browser-matrix']],
  ['npm', ['audit', '--omit=dev']],
  ['npm', ['pack', '--dry-run']],
]

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
const ciWorkflow = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)
const releaseWorkflow = readFileSync(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
)
const suppressingShell = `bash -c 'source "$1" || true' -- {0}`
const bypassingPolicies = [
  ['an always() condition', 'if: always()'],
  ['an explicit condition', "if: github.event_name == 'workflow_dispatch'"],
  ['literal failure tolerance', 'continue-on-error: true'],
  [
    'expression failure tolerance',
    "continue-on-error: ${{ github.event_name == 'workflow_dispatch' }}",
  ],
]

const requiredText = (url) => {
  assert.equal(existsSync(url), true, `missing ${url.pathname}`)
  return readFileSync(url, 'utf8')
}

const replaceOnce = (source, expected, replacement) => {
  assert.notEqual(source.indexOf(expected), -1, `missing ${expected}`)
  return source.replace(expected, replacement)
}

const replaceInJob = (source, jobName, expected, replacement) => {
  const marker = `  ${jobName}:\n`
  const start = source.indexOf(marker)
  assert.notEqual(start, -1, `missing job ${jobName}`)
  const remainder = source.slice(start + marker.length)
  const nextJob = remainder.search(/^ {2}[\w-]+:\s*$/m)
  const end = nextJob === -1 ? source.length : start + marker.length + nextJob
  const job = source.slice(start, end)
  assert.notEqual(
    job.indexOf(expected),
    -1,
    `missing ${expected} in ${jobName}`,
  )
  return (
    source.slice(0, start) +
    job.replace(expected, replacement) +
    source.slice(end)
  )
}

test('runs every readiness gate in deterministic order', () => {
  const calls = []
  const runner = (command, args, options) => {
    calls.push([command, args, options])
    return { status: 0 }
  }

  assert.equal(runReadinessChecks({ runner }), 0)
  assert.deepEqual(
    calls,
    expectedCommands.map(([command, args]) => [
      command,
      args,
      { stdio: 'inherit' },
    ]),
  )
})

test('stops at the first failed readiness gate', () => {
  const calls = []
  const runner = (command, args) => {
    calls.push([command, args])
    return { status: calls.length === 2 ? 17 : 0 }
  }

  assert.equal(runReadinessChecks({ runner }), 17)
  assert.deepEqual(calls, expectedCommands.slice(0, 2))
})

test('runs an injected harmless command list', () => {
  const commands = [
    [process.execPath, ['-e', 'process.exit(0)']],
    [process.execPath, ['-e', 'process.exit(9)']],
  ]
  const calls = []
  const runner = (command, args) => {
    calls.push([command, args])
    return { status: 0 }
  }

  assert.equal(runReadinessChecks({ commands, runner }), 0)
  assert.deepEqual(calls, commands)
})

test('real runner propagates child failure through the CLI and stops', () => {
  const directory = mkdtempSync(join(tmpdir(), 'release-readiness-'))
  const marker = join(directory, 'launched-after-failure')
  const previousExitCode = process.exitCode

  try {
    process.exitCode = undefined
    const status = runReadinessCli({
      commands: [
        [process.execPath, ['-e', 'process.exit(0)']],
        [process.execPath, ['-e', 'process.exit(23)']],
        [
          process.execPath,
          [
            '-e',
            `require('node:fs').writeFileSync(${JSON.stringify(marker)}, '')`,
          ],
        ],
      ],
    })

    assert.equal(status, 23)
    assert.equal(process.exitCode, 23)
    assert.equal(existsSync(marker), false)
  } finally {
    process.exitCode = previousExitCode
    rmSync(directory, { force: true, recursive: true })
  }
})

test('importing the readiness module does not execute its CLI', () => {
  const moduleUrl = new URL('./verify-release-readiness.mjs', import.meta.url)
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(moduleUrl.href)})`,
    ],
    { encoding: 'utf8' },
  )

  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
  assert.equal(result.stderr, '')
})

test('readiness manifest contains no direct publication or repository mutation', () => {
  assert.deepEqual(readinessCommands, expectedCommands)
  assert.equal(
    readinessCommands.some(([command, args]) =>
      /publish|release create|npm dist-tag|git tag|npm version/.test(
        `${command} ${args.join(' ')}`,
      ),
    ),
    false,
  )
})

test('accepts the reachable readiness package-script graph', () => {
  assert.deepEqual(
    validateReadinessScriptGraph({ scripts: packageJson.scripts }),
    [],
  )
})

for (const [scriptName, canonicalCommand] of [
  ['test:e2e', 'playwright test'],
  ['test:website:e2e', 'playwright test --config playwright.website.config.ts'],
]) {
  for (const suffix of [
    '--reporter=json',
    '--grep @release:one-scenario',
    '--grep-invert @release:',
    '--project=chromium',
    'e2e/bottom-sheet.spec.ts',
    '--pass-with-no-tests',
    '--shard=1/2',
    '--test-list=selected-tests.txt',
  ]) {
    test(`rejects ${scriptName} package-script override: ${suffix}`, () => {
      const scripts = {
        ...packageJson.scripts,
        [scriptName]: `${canonicalCommand} ${suffix}`,
      }

      assert.match(
        validateReadinessScriptGraph({ scripts }).join('\n'),
        new RegExp(`${scriptName} must be exactly`),
      )
    })
  }
}

for (const hook of [
  'pretest:e2e',
  'posttest:e2e',
  'pretest:website:e2e',
  'posttest:website:e2e',
]) {
  test(`rejects the ${hook} browser-runner lifecycle hook`, () => {
    const scripts = { ...packageJson.scripts, [hook]: 'echo unexpected hook' }

    assert.match(
      validateReadinessScriptGraph({ scripts }).join('\n'),
      new RegExp(`browser runner lifecycle hook must be absent: ${hook}`),
    )
  })
}

test('rejects readiness recursion through a reachable script', () => {
  const scripts = {
    ...packageJson.scripts,
    check: `${packageJson.scripts.check} && npm run release:check`,
  }

  assert.match(
    validateReadinessScriptGraph({ scripts }).join('\n'),
    /readiness package-script cycle: release:check -> check -> release:check/,
  )
})

test('rejects release mutations in every reachable script', () => {
  for (const command of [
    'npm publish',
    'npm version prerelease',
    'npm dist-tag add package@version next',
    'git tag v5.0.0-alpha.0',
    'gh release create v5.0.0-alpha.0',
  ]) {
    const scripts = {
      ...packageJson.scripts,
      'test:browser-matrix': command,
    }

    assert.match(
      validateReadinessScriptGraph({ scripts }).join('\n'),
      /reachable script test:browser-matrix contains a release mutation/,
    )
  }
})

test('rejects release mutations in pack lifecycle hooks', () => {
  for (const hook of ['prepack', 'prepare', 'postpack']) {
    const scripts = {
      ...packageJson.scripts,
      [hook]: 'npm publish',
    }

    assert.match(
      validateReadinessScriptGraph({ scripts }).join('\n'),
      new RegExp(`reachable script ${hook} contains a release mutation`),
    )
  }
})

test('rejects release mutations in reachable npm run lifecycle hooks', () => {
  for (const hook of [
    'prerelease:check',
    'precheck',
    'postcheck',
    'pretest:browser-matrix',
  ]) {
    const scripts = {
      ...packageJson.scripts,
      [hook]: 'npm publish',
    }

    assert.match(
      validateReadinessScriptGraph({ scripts }).join('\n'),
      new RegExp(`reachable script ${hook} contains a release mutation`),
    )
  }
})

test('rejects recursion through a reachable npm run lifecycle hook', () => {
  const scripts = {
    ...packageJson.scripts,
    precheck: 'npm run release:check',
  }

  assert.match(
    validateReadinessScriptGraph({ scripts }).join('\n'),
    /readiness package-script cycle: release:check -> precheck -> release:check/,
  )
})

test('does not treat arbitrary unused lifecycle scripts as reachable', () => {
  const scripts = {
    ...packageJson.scripts,
    'preunused-command': 'npm publish',
    'postunused-command': 'git tag unexpected',
  }

  assert.deepEqual(validateReadinessScriptGraph({ scripts }), [])
})

test('package scripts expose readiness and keep its policy tests in check', () => {
  assert.equal(
    packageJson.scripts['release:check'],
    'node scripts/verify-release-readiness.mjs',
  )
  assert.match(
    packageJson.scripts['test:release'],
    /scripts\/verify-release-readiness\.test\.mjs/,
  )
  assert.match(
    packageJson.scripts['test:release'],
    /scripts\/playwright-release-reporter\.test\.mjs/,
  )
})

test('readiness report lists automated gates and leaves every sign-off open', () => {
  const report = requiredText(
    new URL('../docs/releases/v5-alpha-readiness.md', import.meta.url),
  )
  const automatedCommands = [
    'npm ci',
    'npm run release:check',
    'npm run test:e2e',
    'npm run test:website:e2e',
  ]
  const manualSignOffs = [
    'VoiceOver on macOS or iOS',
    'Keyboard-only modal and non-modal operation',
    'iOS Safari on a physical device',
    'Android Chrome on a physical device',
    'Production domain, sitemap, social metadata, and examples',
    'npm trusted publisher and GitHub `npm` environment protection',
  ]

  for (const command of automatedCommands) {
    assert.ok(report.includes(`- \`${command}\``), `missing ${command}`)
  }

  const checkboxes = [...report.matchAll(/^- \[([ xX])\] (.+)$/gm)]
  assert.deepEqual(
    checkboxes.map((match) => [match[1], match[2]]),
    manualSignOffs.map((signOff) => [' ', signOff]),
  )
  assert.match(report, /`npm audit --omit=dev`[^\n]*block/i)
  assert.match(
    report,
    /full development\s+audit[\s\S]{0,100}informational[\s\S]{0,100}triag/i,
  )
})

test('prerelease instructions order clean install before readiness and sign-off', () => {
  const releasing = requiredText(
    new URL('../docs/RELEASING.md', import.meta.url),
  )
  const prerelease = releasing.slice(
    releasing.indexOf('## Prepare a prerelease'),
    releasing.indexOf('## Publish the stable release'),
  )
  const milestones = [
    'npm ci',
    'npm run release:check',
    'npm run test:e2e',
    'npm run test:website:e2e',
    'Vercel preview',
    'manual sign-off',
    'Merge the reviewed release commit',
    'explicitly authorizes publication',
  ]

  let previous = -1
  for (const milestone of milestones) {
    const index = prerelease.indexOf(milestone)
    assert.ok(index > previous, `${milestone} must follow the prior milestone`)
    previous = index
  }
})

test('stable release instructions preserve every protected promotion stage', () => {
  const releasing = requiredText(
    new URL('../docs/RELEASING.md', import.meta.url),
  )
  const setup = releasing.slice(
    releasing.indexOf('## One-time repository setup'),
    releasing.indexOf('## Prepare a prerelease'),
  )
  const stable = releasing.slice(
    releasing.indexOf('## Publish the stable release'),
  )
  const normalizedSetup = setup.replaceAll(/\s+/g, ' ')
  const normalizedStable = stable.replaceAll(/\s+/g, ' ')
  const milestones = [
    'promotion pull request',
    'production deployment',
    'production sign-off pull request',
    'SIGNED_OFF_SHA',
    'head SHA',
    'approve the protected environment deployment',
    'registry checks succeed',
    'website-state pull request',
  ]

  assert.match(normalizedSetup, /solo-maintainer self-review exception/i)
  assert.doesNotMatch(normalizedSetup, /prevent self-review/i)
  assert.ok(
    normalizedStable.includes(
      'test "$(gh run view "$RUN_ID" --json headSha --jq .headSha)" = "$SIGNED_OFF_SHA"',
    ),
    'stable publication must prove the workflow head SHA exactly',
  )

  let previous = -1
  for (const milestone of milestones) {
    const index = normalizedStable.indexOf(milestone)
    assert.ok(index > previous, `${milestone} must follow the prior milestone`)
    previous = index
  }
})

test('accepts the checked workflow readiness policy', () => {
  assert.deepEqual(
    validateReadinessWorkflows({ ciWorkflow, releaseWorkflow }),
    [],
  )
})

test('models workflow, job, and step shells separately from commands', () => {
  const [job] = parseWorkflowModel(
    [
      'defaults:',
      '  run:',
      `    'shell': ${suppressingShell}`,
      'jobs:',
      '  browsers:',
      "    'if': github.event_name == 'never'",
      "    'continue-on-error': ${{ matrix.project == 'webkit' }}",
      '    runs-on: ubuntu-latest',
      '    defaults:',
      '      run:',
      `        'shell': ${suppressingShell}`,
      '    steps:',
      "      - 'if': matrix.project != 'webkit'",
      "        'continue-on-error': true",
      `        'shell': ${suppressingShell}`,
      '        run: npm run test:e2e -- --project=${{ matrix.project }}',
      '',
    ].join('\n'),
  )

  assert.equal(job.if, "github.event_name == 'never'")
  assert.equal(job.continueOnError, "${{ matrix.project == 'webkit' }}")
  assert.equal(job.workflowShell, suppressingShell)
  assert.equal(job.defaultShell, suppressingShell)
  assert.deepEqual(job.steps, [
    {
      commands: ['npm run test:e2e -- --project=${{ matrix.project }}'],
      if: "matrix.project != 'webkit'",
      continueOnError: 'true',
      shell: suppressingShell,
    },
  ])
})

for (const [label, workflowName] of [
  ['CI', 'ciWorkflow'],
  ['release', 'releaseWorkflow'],
]) {
  test(`rejects a suppressing workflow-default shell in ${label}`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceOnce(
      workflows[workflowName],
      'jobs:\n',
      [
        'defaults:',
        '  run:',
        `    shell: ${suppressingShell}`,
        '',
        'jobs:',
        '',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} workflow must not customize the shell for critical run steps`,
      ),
    )
  })

  for (const jobName of ['quality', 'browsers', 'chromium-touch']) {
    test(`rejects a suppressing ${jobName} job-default shell in ${label}`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        jobName,
        '    runs-on: ubuntu-latest',
        [
          '    runs-on: ubuntu-latest',
          '    defaults:',
          '      run:',
          `        shell: ${suppressingShell}`,
        ].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} ${jobName} must not customize the shell for critical run steps`,
        ),
      )
    })
  }

  for (const [jobName, command] of [
    ['quality', 'npm run release:check'],
    ['browsers', 'npm run test:e2e -- --project=${{ matrix.project }}'],
    ['chromium-touch', 'npm run test:e2e -- --project=chromium-touch'],
  ]) {
    test(`rejects a suppressing ${jobName} step shell in ${label}`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        jobName,
        `      - run: ${command}`,
        [`      - run: ${command}`, `        shell: ${suppressingShell}`].join(
          '\n',
        ),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} ${jobName} must not customize the shell for critical run steps`,
        ),
      )
    })
  }

  for (const [policyName, setting] of bypassingPolicies) {
    test(`rejects ${policyName} on the ${label} quality job`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        'quality',
        '    runs-on: ubuntu-latest',
        ['    runs-on: ubuntu-latest', `    ${setting}`].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} quality job must be unconditional and non-tolerated`,
        ),
      )
    })

    test(`rejects ${policyName} on the ${label} quality check step`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        'quality',
        '      - run: npm run release:check',
        ['      - run: npm run release:check', `        ${setting}`].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} quality run steps must be unconditional and non-tolerated`,
        ),
      )
    })
  }

  test(`allows explicitly disabled tolerance on the ${label} quality path`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'quality',
      '    runs-on: ubuntu-latest',
      ['    runs-on: ubuntu-latest', '    continue-on-error: false'].join('\n'),
    )
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'quality',
      '      - run: npm run release:check',
      [
        '      - run: npm run release:check',
        '        continue-on-error: false',
      ].join('\n'),
    )

    assert.deepEqual(validateReadinessWorkflows(workflows), [])
  })

  test(`rejects an independently collapsed ${label} desktop matrix`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'browsers',
      '        project: [chromium, firefox, webkit]',
      '        project: [chromium]',
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} browsers must use exactly chromium, firefox, webkit`,
      ),
    )
  })

  test(`rejects a ${label} desktop matrix exclusion`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'browsers',
      '        project: [chromium, firefox, webkit]',
      [
        '        project: [chromium, firefox, webkit]',
        '        exclude:',
        '          - project: webkit',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} browsers must use exactly chromium, firefox, webkit`,
      ),
    )
  })

  test(`requires ${label} readiness jobs to use ubuntu-latest`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'browsers',
      '    runs-on: ubuntu-latest',
      '    runs-on: macos-latest',
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(`${label} jobs must run on ubuntu-latest: browsers`),
    )
  })

  for (const [name, jobName, setting, expectedError] of [
    [
      'desktop job condition',
      'browsers',
      "if: ${{ github.event_name == 'never' }}",
      `${label} browsers job must be unconditional and non-tolerated`,
    ],
    [
      'desktop job failure tolerance',
      'browsers',
      'continue-on-error: true',
      `${label} browsers job must be unconditional and non-tolerated`,
    ],
    [
      'matrix-dependent desktop job failure tolerance',
      'browsers',
      "continue-on-error: ${{ matrix.project == 'webkit' }}",
      `${label} browsers job must be unconditional and non-tolerated`,
    ],
    [
      'touch job condition',
      'chromium-touch',
      "if: ${{ github.event_name == 'never' }}",
      `${label} chromium-touch job must be unconditional and non-tolerated`,
    ],
    [
      'touch job failure tolerance',
      'chromium-touch',
      'continue-on-error: true',
      `${label} chromium-touch job must be unconditional and non-tolerated`,
    ],
    [
      'quoted desktop job condition',
      'browsers',
      "'if': ${{ github.event_name == 'never' }}",
      `${label} browsers job must be unconditional and non-tolerated`,
    ],
    [
      'quoted touch job failure tolerance',
      'chromium-touch',
      "'continue-on-error': true",
      `${label} chromium-touch job must be unconditional and non-tolerated`,
    ],
  ]) {
    test(`rejects ${name} in ${label}`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        jobName,
        '    runs-on: ubuntu-latest',
        ['    runs-on: ubuntu-latest', `    ${setting}`].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(expectedError),
      )
    })
  }

  for (const [jobName, expectedError] of [
    [
      'browsers',
      `${label} browser steps must be unconditional and non-tolerated`,
    ],
    [
      'chromium-touch',
      `${label} chromium-touch steps must be unconditional and non-tolerated`,
    ],
  ]) {
    for (const [policyName, setting] of [
      ['condition', 'if: always()'],
      ['failure tolerance', 'continue-on-error: true'],
    ]) {
      test(`rejects a ${policyName} on ${label} ${jobName} npm ci`, () => {
        const workflows = { ciWorkflow, releaseWorkflow }
        workflows[workflowName] = replaceInJob(
          workflows[workflowName],
          jobName,
          '      - run: npm ci',
          ['      - run: npm ci', `        ${setting}`].join('\n'),
        )

        assert.match(
          validateReadinessWorkflows(workflows).join('\n'),
          new RegExp(expectedError),
        )
      })
    }
  }

  for (const [name, command, replacement] of [
    [
      'browser installation',
      'npx playwright install --with-deps ${{ matrix.project }}',
      'npx playwright install --with-deps chromium',
    ],
    [
      'library project selection',
      'npm run test:e2e -- --project=${{ matrix.project }}',
      'npm run test:e2e -- --project=chromium',
    ],
    [
      'website project selection',
      'npm run test:website:e2e -- --project=${{ matrix.project }}',
      'npm run test:website:e2e -- --project=chromium',
    ],
  ]) {
    test(`requires matching ${label} ${name}`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        'browsers',
        command,
        replacement,
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} browsers must install and execute each desktop project in both suites`,
        ),
      )
    })
  }

  test(`rejects ${label} desktop steps that exclude WebKit`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    let mutatedWorkflow = workflows[workflowName]

    for (const command of [
      'npm run test:e2e -- --project=${{ matrix.project }}',
      'npm run test:website:e2e -- --project=${{ matrix.project }}',
    ]) {
      mutatedWorkflow = replaceInJob(
        mutatedWorkflow,
        'browsers',
        `      - run: ${command}`,
        [
          `      - run: ${command}`,
          "        if: matrix.project != 'webkit'",
        ].join('\n'),
      )
    }
    workflows[workflowName] = mutatedWorkflow

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} browser steps must be unconditional and non-tolerated`,
      ),
    )
  })

  for (const [name, setting] of [
    ['quoted WebKit-excluding condition', "'if': matrix.project != 'webkit'"],
    ['quoted failure tolerance', "'continue-on-error': true"],
  ]) {
    test(`rejects a ${name} on the ${label} desktop execution`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        'browsers',
        '      - run: npm run test:e2e -- --project=${{ matrix.project }}',
        [
          '      - run: npm run test:e2e -- --project=${{ matrix.project }}',
          `        ${setting}`,
        ].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} browser steps must be unconditional and non-tolerated`,
        ),
      )
    })
  }

  test(`rejects a shell-conditional ${label} desktop execution`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'browsers',
      '      - run: npm run test:e2e -- --project=${{ matrix.project }}',
      [
        '      - name: Conditionally run library suite',
        '        run: |',
        '          if false; then',
        '            npm run test:e2e -- --project=${{ matrix.project }}',
        '          fi',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} browsers must install and execute each desktop project in both suites`,
      ),
    )
  })

  for (const [name, jobName, command, expectedError] of [
    [
      'desktop browser installation',
      'browsers',
      'npx playwright install --with-deps ${{ matrix.project }}',
      `${label} browser steps must be unconditional and non-tolerated`,
    ],
    [
      'desktop library execution',
      'browsers',
      'npm run test:e2e -- --project=${{ matrix.project }}',
      `${label} browser steps must be unconditional and non-tolerated`,
    ],
    [
      'desktop website execution',
      'browsers',
      'npm run test:website:e2e -- --project=${{ matrix.project }}',
      `${label} browser steps must be unconditional and non-tolerated`,
    ],
    [
      'touch browser installation',
      'chromium-touch',
      'npx playwright install --with-deps chromium',
      `${label} chromium-touch steps must be unconditional and non-tolerated`,
    ],
    [
      'touch execution',
      'chromium-touch',
      'npm run test:e2e -- --project=chromium-touch',
      `${label} chromium-touch steps must be unconditional and non-tolerated`,
    ],
  ]) {
    test(`rejects continue-on-error for ${label} ${name}`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        jobName,
        `      - run: ${command}`,
        [`      - run: ${command}`, '        continue-on-error: true'].join(
          '\n',
        ),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(expectedError),
      )
    })
  }

  test(`requires ${label} chromium-touch to install Chromium`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'chromium-touch',
      'npx playwright install --with-deps chromium',
      'npx playwright install --with-deps firefox',
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      ),
    )
  })

  test(`rejects an Ubuntu-false condition on the ${label} chromium-touch execution`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'chromium-touch',
      '      - run: npm run test:e2e -- --project=chromium-touch',
      [
        '      - run: npm run test:e2e -- --project=chromium-touch',
        "        if: runner.os == 'Windows'",
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch steps must be unconditional and non-tolerated`,
      ),
    )
  })

  test(`rejects shell-level failure tolerance in the ${label} chromium-touch execution`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'chromium-touch',
      '      - run: npm run test:e2e -- --project=chromium-touch',
      [
        '      - name: Tolerate touch failure',
        '        run: |',
        '          set +e',
        '          npm run test:e2e -- --project=chromium-touch',
        '          true',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      ),
    )
  })

  test(`rejects website execution in the ${label} chromium-touch job`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'chromium-touch',
      '      - run: npm run test:e2e -- --project=chromium-touch',
      [
        '      - run: npm run test:e2e -- --project=chromium-touch',
        '      - run: npm run test:website:e2e -- --project=chromium-touch',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      ),
    )
  })

  test(`rejects a matrix that repeats the ${label} chromium-touch job`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'chromium-touch',
      '    runs-on: ubuntu-latest',
      [
        '    runs-on: ubuntu-latest',
        '    strategy:',
        '      matrix:',
        '        shard: [one, two]',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      ),
    )
  })

  test(`rejects a second ${label} chromium-touch execution`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'browsers',
      '      - run: npm run test:website:e2e -- --project=${{ matrix.project }}',
      [
        '      - run: npm run test:website:e2e -- --project=${{ matrix.project }}',
        '      - run: npm run test:e2e -- --project=chromium-touch',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      ),
    )
  })

  test(`rejects a wrapped duplicate ${label} chromium-touch execution`, () => {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceInJob(
      workflows[workflowName],
      'browsers',
      '      - run: npm run test:website:e2e -- --project=${{ matrix.project }}',
      [
        '      - run: npm run test:website:e2e -- --project=${{ matrix.project }}',
        '      - run: env DUPLICATE=1 npm run test:e2e -- --project=chromium-touch',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      new RegExp(
        `${label} chromium-touch must run exactly once as a separate library-only job`,
      ),
    )
  })

  for (const duplicate of [
    'NAME=value npm run test:e2e -- --project chromium-touch',
    'command env NAME=value npm run test:e2e -- --project chromium-touch',
    "env DUPLICATE=1 npm run test:e2e -- --project='chromium-touch'",
    'env DUPLICATE=1 npm run test:e2e -- --project chromium chromium-touch',
    "env MARK='a|b' npm run test:e2e -- --project chromium chromium-touch",
    '/usr/bin/env DUPLICATE=1 npm run test:e2e -- --project=chromium-touch',
    'env DUPLICATE=1 npm --silent run test:e2e -- --project=chromium-touch',
  ]) {
    test(`rejects the ${label} duplicate touch form: ${duplicate}`, () => {
      const workflows = { ciWorkflow, releaseWorkflow }
      workflows[workflowName] = replaceInJob(
        workflows[workflowName],
        'browsers',
        '      - run: npm run test:website:e2e -- --project=${{ matrix.project }}',
        [
          '      - run: npm run test:website:e2e -- --project=${{ matrix.project }}',
          `      - run: ${duplicate}`,
        ].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows(workflows).join('\n'),
        new RegExp(
          `${label} chromium-touch must run exactly once as a separate library-only job`,
        ),
      )
    })
  }
}

for (const jobName of ['verify', 'publish']) {
  test(`rejects a suppressing ${jobName} job-default shell in release`, () => {
    const releaseWithCustomShell = replaceInJob(
      releaseWorkflow,
      jobName,
      '    runs-on: ubuntu-latest',
      [
        '    runs-on: ubuntu-latest',
        '    defaults:',
        '      run:',
        `        shell: ${suppressingShell}`,
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows({
        ciWorkflow,
        releaseWorkflow: releaseWithCustomShell,
      }).join('\n'),
      new RegExp(
        `release ${jobName} must not customize the shell for critical run steps`,
      ),
    )
  })
}

for (const [jobName, runLine] of [
  [
    'verify',
    '      - run: echo "Release quality and browser verification passed"',
  ],
  ['publish', '        run: npm publish --access public --tag "$CHANNEL"'],
]) {
  test(`rejects a suppressing ${jobName} step shell in release`, () => {
    const releaseWithCustomShell = replaceInJob(
      releaseWorkflow,
      jobName,
      runLine,
      [runLine, `        shell: ${suppressingShell}`].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows({
        ciWorkflow,
        releaseWorkflow: releaseWithCustomShell,
      }).join('\n'),
      new RegExp(
        `release ${jobName} must not customize the shell for critical run steps`,
      ),
    )
  })
}

for (const jobName of ['verify', 'publish']) {
  for (const [policyName, setting] of bypassingPolicies) {
    test(`rejects ${policyName} on the release ${jobName} job`, () => {
      const releaseWithBypass = replaceInJob(
        releaseWorkflow,
        jobName,
        '    runs-on: ubuntu-latest',
        ['    runs-on: ubuntu-latest', `    ${setting}`].join('\n'),
      )

      assert.match(
        validateReadinessWorkflows({
          ciWorkflow,
          releaseWorkflow: releaseWithBypass,
        }).join('\n'),
        new RegExp(
          `release ${jobName} job must be unconditional and non-tolerated`,
        ),
      )
    })
  }
}

for (const [policyName, setting] of bypassingPolicies) {
  test(`rejects ${policyName} on the release verify step`, () => {
    const runLine =
      '      - run: echo "Release quality and browser verification passed"'
    const releaseWithBypass = replaceInJob(
      releaseWorkflow,
      'verify',
      runLine,
      [runLine, `        ${setting}`].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows({
        ciWorkflow,
        releaseWorkflow: releaseWithBypass,
      }).join('\n'),
      /release verify run steps must be unconditional and non-tolerated/,
    )
  })

  test(`rejects ${policyName} on the release publish step`, () => {
    const releaseWithBypass = replaceInJob(
      releaseWorkflow,
      'publish',
      '      - name: Publish package',
      ['      - name: Publish package', `        ${setting}`].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows({
        ciWorkflow,
        releaseWorkflow: releaseWithBypass,
      }).join('\n'),
      /release publish run steps must be unconditional and non-tolerated/,
    )
  })
}

test('allows explicitly disabled tolerance on release verify and publish', () => {
  let releaseWithDisabledTolerance = replaceInJob(
    releaseWorkflow,
    'verify',
    '    runs-on: ubuntu-latest',
    ['    runs-on: ubuntu-latest', '    continue-on-error: false'].join('\n'),
  )
  releaseWithDisabledTolerance = replaceInJob(
    releaseWithDisabledTolerance,
    'publish',
    '      - name: Publish package',
    ['      - name: Publish package', '        continue-on-error: false'].join(
      '\n',
    ),
  )

  assert.deepEqual(
    validateReadinessWorkflows({
      ciWorkflow,
      releaseWorkflow: releaseWithDisabledTolerance,
    }),
    [],
  )
})

for (const [stepName, setting] of [
  ['Validate release request', 'continue-on-error: true'],
  ['Publish package', 'if: always()'],
  [
    'Verify registry',
    "continue-on-error: ${{ github.event_name == 'workflow_dispatch' }}",
  ],
]) {
  test(`rejects ${setting} on the release ${stepName} step`, () => {
    const releaseWithBypass = replaceInJob(
      releaseWorkflow,
      'publish',
      `      - name: ${stepName}`,
      [`      - name: ${stepName}`, `        ${setting}`].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows({
        ciWorkflow,
        releaseWorkflow: releaseWithBypass,
      }).join('\n'),
      /release publish run steps must be unconditional and non-tolerated/,
    )
  })
}

test('accepts an equivalent block-form desktop project matrix', () => {
  const blockMatrix = [
    '        project:',
    '          - chromium',
    '          - firefox',
    '          - webkit',
  ].join('\n')

  assert.deepEqual(
    validateReadinessWorkflows({
      ciWorkflow: replaceInJob(
        ciWorkflow,
        'browsers',
        '        project: [chromium, firefox, webkit]',
        blockMatrix,
      ),
      releaseWorkflow,
    }),
    [],
  )
})

test('rejects a named duplicate check step in either quality job', () => {
  for (const workflowName of ['ciWorkflow', 'releaseWorkflow']) {
    const workflows = { ciWorkflow, releaseWorkflow }
    workflows[workflowName] = replaceOnce(
      workflows[workflowName],
      '      - run: npm run release:check\n',
      [
        '      - run: npm run release:check',
        '      - name: Duplicate full check',
        '        run: npm run check',
        '',
      ].join('\n'),
    )

    assert.match(
      validateReadinessWorkflows(workflows).join('\n'),
      /quality must run only npm ci and npm run release:check/,
    )
  }
})

test('ignores commands in workflow comments and inert step metadata', () => {
  const workflowWithInertText = replaceOnce(
    ciWorkflow,
    '      - run: npm run release:check\n',
    [
      '      - run: npm run release:check',
      '      # run: npm run check',
      '      - uses: actions/cache@v5',
      '        with:',
      '          note: npm run check',
      '',
    ].join('\n'),
  )

  assert.deepEqual(
    validateReadinessWorkflows({
      ciWorkflow: workflowWithInertText,
      releaseWorkflow,
    }),
    [],
  )
})

test('rejects a touch job whose command survives only in a comment', () => {
  const withoutExecutableTouch = replaceOnce(
    ciWorkflow,
    '      - run: npm run test:e2e -- --project=chromium-touch',
    [
      '      - run: echo "touch execution skipped"',
      '      # run: npm run test:e2e -- --project=chromium-touch',
    ].join('\n'),
  )

  assert.match(
    validateReadinessWorkflows({
      ciWorkflow: withoutExecutableTouch,
      releaseWorkflow,
    }).join('\n'),
    /CI chromium-touch must execute its browser project/,
  )
})

test('rejects a publish graph disconnected from readiness quality', () => {
  const disconnectedRelease = releaseWorkflow
    .replaceAll('    needs: quality\n', '    needs: []\n')
    .replace(
      '    needs: [quality, browsers, chromium-touch]',
      [
        '    needs: [browsers, chromium-touch]',
        '    # needs: [quality, browsers, chromium-touch]',
      ].join('\n'),
    )

  assert.match(
    validateReadinessWorkflows({
      ciWorkflow,
      releaseWorkflow: disconnectedRelease,
    }).join('\n'),
    /release publish must depend on quality readiness/,
  )
})

test('rejects publication that keeps quality but bypasses browser jobs', () => {
  const releaseWithoutBrowserFanIn = replaceOnce(
    releaseWorkflow,
    '    needs: [quality, browsers, chromium-touch]',
    '    needs: quality',
  )

  assert.match(
    validateReadinessWorkflows({
      ciWorkflow,
      releaseWorkflow: releaseWithoutBrowserFanIn,
    }).join('\n'),
    /release publish must depend on desktop and touch browser readiness/,
  )
})
