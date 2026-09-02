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

const requiredText = (url) => {
  assert.equal(existsSync(url), true, `missing ${url.pathname}`)
  return readFileSync(url, 'utf8')
}

const replaceOnce = (source, expected, replacement) => {
  assert.notEqual(source.indexOf(expected), -1, `missing ${expected}`)
  return source.replace(expected, replacement)
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

test('package scripts expose readiness and keep its policy tests in check', () => {
  assert.equal(
    packageJson.scripts['release:check'],
    'node scripts/verify-release-readiness.mjs',
  )
  assert.match(
    packageJson.scripts['test:release'],
    /scripts\/verify-release-readiness\.test\.mjs/,
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

test('accepts the checked workflow readiness policy', () => {
  assert.deepEqual(
    validateReadinessWorkflows({ ciWorkflow, releaseWorkflow }),
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
