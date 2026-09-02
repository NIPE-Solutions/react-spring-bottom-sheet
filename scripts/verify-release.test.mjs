import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

const moveRegistryCheckAfterRelease = (source) => {
  const registryStart = source.indexOf('      - name: Verify registry')
  const releaseStart = source.indexOf('      - name: Create GitHub release')

  assert.ok(registryStart >= 0, 'missing registry verification step')
  assert.ok(releaseStart > registryStart, 'registry check must precede release')

  return (
    source.slice(0, registryStart) +
    source.slice(releaseStart) +
    source.slice(registryStart, releaseStart)
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

test('rejects a release workflow that is not manually dispatched', () => {
  expectPolicyError(
    { workflow: replaceOnce(workflow, 'workflow_dispatch:', 'push:') },
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
  const registryBeforePublish = replaceOnce(
    workflow,
    '          test "$(npm view "$NAME@$CHANNEL" version)" = "$VERSION"',
    '          test "$(npm view "$NAME@$VERSION" version)" = "$VERSION"',
  )

  expectPolicyError(
    { workflow: registryBeforePublish },
    'registry verification must follow publication',
  )
})

test('requires registry verification before GitHub release creation', () => {
  const releaseBeforeVerify = moveRegistryCheckAfterRelease(workflow)

  assert.ok(
    validateReleasePolicy({ packageJson, workflow: releaseBeforeVerify }).some(
      (error) =>
        error.includes('registry verification must precede release creation'),
    ),
  )
})
