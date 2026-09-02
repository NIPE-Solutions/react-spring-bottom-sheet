import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { validateReleasePolicy } from './release-policy.mjs'

const workflow = readFileSync(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

const replaceOnce = (source, expected, replacement) => {
  assert.notEqual(source.indexOf(expected), -1, `missing ${expected}`)
  return source.replace(expected, replacement)
}

const moveNamedStep = (source, stepName, beforeStepName) => {
  const stepStart = source.indexOf(`- name: ${stepName}`)
  const beforeStart = source.indexOf(`- name: ${beforeStepName}`)
  assert.ok(stepStart >= 0, `missing ${stepName} step`)
  assert.ok(beforeStart >= 0, `missing ${beforeStepName} step`)

  const start = source.lastIndexOf('\n', stepStart) + 1
  const nextStep = source.indexOf('\n      - ', stepStart)
  const end = nextStep === -1 ? source.length : nextStep + 1
  const step = source.slice(start, end)
  const withoutStep = source.slice(0, start) + source.slice(end)
  const insertion = withoutStep.indexOf(`- name: ${beforeStepName}`)

  return (
    withoutStep.slice(0, withoutStep.lastIndexOf('\n', insertion) + 1) +
    step +
    withoutStep.slice(withoutStep.lastIndexOf('\n', insertion) + 1)
  )
}

const expectPolicyError = (
  {
    packageJson: mutatedPackage = packageJson,
    workflow: mutatedWorkflow = workflow,
  },
  message,
) => {
  assert.ok(
    validateReleasePolicy({
      packageJson: mutatedPackage,
      workflow: mutatedWorkflow,
    }).some((error) => error.includes(message)),
    `expected policy error: ${message}`,
  )
}

test('accepts the checked release policy', () => {
  assert.deepEqual(validateReleasePolicy({ packageJson, workflow }), [])
})

test('release command keeps the bundle-size release check', () => {
  assert.match(
    packageJson.scripts['test:release'],
    /scripts\/check-bundle-size\.test\.mjs/,
  )
})

test('obsolete semantic-release configuration remains absent', () => {
  assert.equal(
    existsSync(new URL('../release.config.js', import.meta.url)),
    false,
  )
})

test('rejects a release workflow that is not manually dispatched', () => {
  expectPolicyError(
    { workflow: replaceOnce(workflow, 'workflow_dispatch:', 'push:') },
    'release workflow must be manual',
  )
})

test('rejects automatic triggers alongside manual dispatch', () => {
  expectPolicyError(
    { workflow: replaceOnce(workflow, 'on:\n', 'on:\n  push:\n') },
    'release workflow must be manual',
  )
})

test('requires the protected npm environment', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        'environment: npm',
        'environment: staging',
      ),
    },
    'publish job must use the npm environment',
  )
})

test('requires the publishing job itself to use the npm environment', () => {
  const environmentOutsidePublish = replaceOnce(
    replaceOnce(workflow, '    environment: npm\n', ''),
    '  verify:\n',
    '  verify:\n    environment: npm\n',
  )

  expectPolicyError(
    { workflow: environmentOutsidePublish },
    'publish job must use the npm environment',
  )
})

test('requires OIDC without long-lived npm tokens', () => {
  expectPolicyError(
    { workflow: replaceOnce(workflow, 'id-token: write', 'id-token: none') },
    'publish job must request OIDC',
  )
  expectPolicyError(
    { workflow: `${workflow}\n      NODE_AUTH_TOKEN: secret` },
    'release workflow must not use long-lived npm tokens',
  )
})

test('requires the publishing job itself to request OIDC', () => {
  const oidcOutsidePublish = replaceOnce(
    replaceOnce(workflow, '      id-token: write\n', ''),
    '  verify:\n',
    '  verify:\n    permissions:\n      id-token: write\n',
  )

  expectPolicyError(
    { workflow: oidcOutsidePublish },
    'publish job must request OIDC',
  )
})

test('requires the requested version to match package metadata', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        'test "$PACKAGE_VERSION" = "$VERSION"',
        'test "$PACKAGE_VERSION" != "$VERSION"',
      ),
    },
    'requested version must match package.json',
  )
})

test('requires PACKAGE_VERSION to come from package.json', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        'PACKAGE_VERSION=$(node -p "require(\'./package.json\').version")',
        'PACKAGE_VERSION=5.0.0-alpha.0',
      ),
    },
    'package version must be read from package.json',
  )
})

test('binds the package-version source to its equality check', () => {
  const packageVersionInAnotherStep = replaceOnce(
    replaceOnce(
      workflow,
      'PACKAGE_VERSION=$(node -p "require(\'./package.json\').version")',
      'PACKAGE_VERSION=untrusted',
    ),
    '      - name: Verify registry\n        env:\n          CHANNEL: ${{ inputs.channel }}\n          VERSION: ${{ inputs.version }}\n        run: |\n          NAME=$(node -p "require(\'./package.json\').name")',
    '      - name: Verify registry\n        env:\n          CHANNEL: ${{ inputs.channel }}\n          VERSION: ${{ inputs.version }}\n        run: |\n          NAME=$(node -p "require(\'./package.json\').name")\n          PACKAGE_VERSION=$(node -p "require(\'./package.json\').version")',
  )

  expectPolicyError(
    { workflow: packageVersionInAnotherStep },
    'package version must be read from package.json',
  )
})

test('requires an unused package version to fail before publish', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        '            exit 1\n          fi\n      - run: npm run build:dist',
        '            echo "$NAME@$VERSION already exists"\n          fi\n      - run: npm run build:dist',
      ),
    },
    'published versions must be immutable',
  )
})

test('requires the immutable-version check before publication', () => {
  const checkAfterPublish = moveNamedStep(
    workflow,
    'Validate release request',
    'Verify registry',
  )

  expectPolicyError(
    { workflow: checkAfterPublish },
    'published versions must be immutable',
  )
})

test('requires prereleases for the next channel', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        'case "$VERSION" in *-*) ;; *) exit 1 ;; esac',
        'case "$VERSION" in *-*) ;; *) ;; esac',
      ),
    },
    'next must require prerelease versions',
  )
})

test('allows exactly the next and latest release channels', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        '          - latest',
        '          - latest\n          - canary',
      ),
    },
    'release channels must be exactly next and latest',
  )
})

test('rejects a prerelease sent to latest', () => {
  const withoutStableGuard = replaceOnce(
    workflow,
    'case "$VERSION" in *-*) exit 1 ;; esac',
    'case "$VERSION" in *-*) ;; esac',
  )

  assert.ok(
    validateReleasePolicy({ packageJson, workflow: withoutStableGuard }).some(
      (error) => error.includes('latest must reject prerelease versions'),
    ),
  )
})

test('requires latest releases to be dispatched from main', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        'test "$GITHUB_REF_NAME" = "main"',
        'test "$GITHUB_REF_NAME" = "v5"',
      ),
    },
    'latest releases must come from main',
  )
})

test('requires public access and provenance package metadata', () => {
  expectPolicyError(
    {
      packageJson: {
        ...packageJson,
        publishConfig: { ...packageJson.publishConfig, access: 'restricted' },
      },
    },
    'package must publish with public access',
  )
  expectPolicyError(
    {
      packageJson: {
        ...packageJson,
        publishConfig: { ...packageJson.publishConfig, provenance: false },
      },
    },
    'package must publish with provenance',
  )
})

test('requires verification to complete before publishing', () => {
  expectPolicyError(
    { workflow: replaceOnce(workflow, '    needs: verify\n', '') },
    'verification must precede publication',
  )
})

test('requires registry verification after publication', () => {
  const registryBeforePublish = moveNamedStep(
    workflow,
    'Verify registry',
    'Publish package',
  )

  expectPolicyError(
    { workflow: registryBeforePublish },
    'registry verification must follow publication',
  )
})

test('requires registry verification to compare the channel version exactly', () => {
  expectPolicyError(
    {
      workflow: replaceOnce(
        workflow,
        'test "$(npm view "$NAME@$CHANNEL" version)" = "$VERSION"',
        'test "$(npm view "$NAME@$CHANNEL" version)" != "$VERSION"',
      ),
    },
    'registry verification must confirm the requested version',
  )
})

test('rejects a comment that spoofs post-publish registry verification', () => {
  const checkBeforePublish = moveNamedStep(
    workflow,
    'Verify registry',
    'Publish package',
  )
  const commentSpoof = replaceOnce(
    checkBeforePublish,
    '      - name: Create GitHub release',
    '      # test "$(npm view "$NAME@$CHANNEL" version)" = "$VERSION"\n      - name: Create GitHub release',
  )

  expectPolicyError(
    { workflow: commentSpoof },
    'registry verification must follow publication',
  )
})

test('requires registry verification before GitHub release creation', () => {
  const releaseBeforeVerify = moveNamedStep(
    workflow,
    'Create GitHub release',
    'Verify registry',
  )

  assert.ok(
    validateReleasePolicy({ packageJson, workflow: releaseBeforeVerify }).some(
      (error) =>
        error.includes('registry verification must precede release creation'),
    ),
  )
})
