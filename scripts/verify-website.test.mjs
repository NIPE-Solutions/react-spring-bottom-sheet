import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const requiredRoutes = [
  'introduction',
  'installation',
  'anatomy',
  'state',
  'snap-points',
  'gestures',
  'accessibility',
  'styling',
  'examples',
  'api',
  'migration',
  'troubleshooting',
]

test('the documentation manifest covers every required topic', async () => {
  const { docs } = await import('../website/content/docs.ts')

  assert.deepEqual(
    docs.map(({ slug }) => slug),
    requiredRoutes,
  )
  for (const page of docs) {
    assert.ok(page.title)
    assert.ok(page.description)
    assert.ok(page.sections.length > 0)
  }
})

test('the README includes the public entry points and project lineage', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')

  for (const value of [
    'Sheet.Root',
    '/core.css',
    '/theme.css',
    'stipsan/react-spring-bottom-sheet',
    'JasGH/react-spring-bottom-sheet',
  ]) {
    assert.match(readme, new RegExp(value.replaceAll('/', '\\/')))
  }
})

test('the v4 migration guide maps public API and styling changes', () => {
  const path = new URL('../docs/migration-v4-to-v5.md', import.meta.url)
  assert.ok(existsSync(path))
  const migration = readFileSync(path, 'utf8')

  for (const heading of ['Props', 'Callbacks', 'CSS', 'Imports']) {
    assert.match(migration, new RegExp(`## ${heading}`))
  }
})

test('obsolete website entry points are removed', () => {
  for (const path of ['../pages/index.tsx', '../tailwind.config.js']) {
    assert.equal(existsSync(new URL(path, import.meta.url)), false)
  }
})

test('the website publishes search and social metadata routes', () => {
  for (const path of [
    '../website/app/sitemap.ts',
    '../website/app/robots.ts',
    '../website/app/opengraph-image.tsx',
  ]) {
    assert.ok(existsSync(new URL(path, import.meta.url)), path)
  }
})

test('displayed public API examples have a type-check fixture', () => {
  assert.ok(
    existsSync(new URL('../test/types/docs-examples.tsx', import.meta.url)),
  )
})

test('the website keeps the generated public API reference inputs available', () => {
  for (const path of [
    '../website/generated/public-api.json',
    '../website/content/reference/public-api.ts',
    '../website/content/reference/behavior.tsx',
  ]) {
    assert.ok(existsSync(new URL(path, import.meta.url)), path)
  }

  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  )
  const check = packageJson.scripts.check

  assert.ok(check.includes('npm run test:api'))
  assert.ok(
    check.indexOf('npm run build:dist') < check.indexOf('npm run test:api'),
  )
  assert.match(packageJson.scripts['build:website'], /npm run generate:api/)
})

test('Vercel serves the exported website as static files', () => {
  const config = JSON.parse(
    readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
  )

  assert.equal(config.framework, null)
  assert.equal(config.buildCommand, 'npm run build:website')
  assert.equal(config.installCommand, 'npm ci')
  assert.equal(config.outputDirectory, 'website/out')
})
