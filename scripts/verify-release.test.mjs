import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
)
const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

test('publishing is manual, protected, and uses trusted publishing', () => {
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /environment: npm/)
  assert.match(workflow, /id-token: write/)
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|NPM_TOKEN/)
})

test('release channels and immutable versions are validated before publish', () => {
  assert.match(workflow, /options:\s*\n\s*- next\s*\n\s*- latest/)
  assert.match(workflow, /npm view .*\$VERSION.* version/)
  assert.match(workflow, /npm publish --access public --tag/)
})

test('the package declares public registry access', () => {
  assert.deepEqual(packageJson.publishConfig, {
    access: 'public',
    provenance: true,
  })
})

test('obsolete semantic-release configuration is removed', () => {
  assert.equal(
    existsSync(new URL('../release.config.js', import.meta.url)),
    false,
  )
})
