import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { parse } from 'yaml'

const configUrl = new URL('../.github/dependabot.yml', import.meta.url)

test('Dependabot keeps npm and workflow dependencies current without grouping majors', async () => {
  const config = parse(await readFile(configUrl, 'utf8'))

  assert.equal(config.version, 2)
  assert.deepEqual(
    config.updates.map((update) => update['package-ecosystem']),
    ['npm', 'github-actions'],
  )

  for (const update of config.updates) {
    assert.equal(update.directory, '/')
    assert.equal(update.schedule.interval, 'weekly')
    assert.equal(update.schedule.time, '06:00')
    assert.equal(update.schedule.timezone, 'Europe/Vienna')
    assert.equal(update['open-pull-requests-limit'], 5)

    for (const group of Object.values(update.groups)) {
      assert.deepEqual(group.patterns, ['*'])
      assert.deepEqual(group['update-types'], ['minor', 'patch'])
    }
  }

  assert.deepEqual(Object.keys(config.updates[0].groups), [
    'production-minor-and-patch',
    'development-minor-and-patch',
  ])
  assert.equal(
    config.updates[0].groups['production-minor-and-patch']['dependency-type'],
    'production',
  )
  assert.equal(
    config.updates[0].groups['development-minor-and-patch']['dependency-type'],
    'development',
  )

  assert.deepEqual(config.updates[0].ignore, [
    {
      'dependency-name': '@types/node',
      'update-types': ['version-update:semver-major'],
    },
  ])
})
