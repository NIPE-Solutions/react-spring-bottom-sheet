import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const requiredRoutes = [
  'introduction',
  'installation',
  'anatomy',
  'state',
  'events',
  'snap-points',
  'gestures',
  'portals',
  'accessibility',
  'styling',
  'examples',
  'api',
  'testing',
  'performance',
  'migration',
  'troubleshooting',
  'support',
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

test('the Examples documentation page links to the interactive laboratory', async () => {
  const { docs } = await import('../website/content/docs.ts')
  const examples = docs.find(({ slug }) => slug === 'examples')

  assert.deepEqual(examples?.sections[0]?.link, {
    href: '/examples/',
    label: 'Open the example laboratory',
  })
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

test('recipe embeds are statically generated and excluded from search', () => {
  const embedPage = readFileSync(
    new URL(
      '../website/app/(embed)/examples/[slug]/embed/page.tsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(embedPage, /generateStaticParams/)
  assert.match(embedPage, /index:\s*false/)
  assert.match(embedPage, /follow:\s*false/)
})

test('the website publishes its legal and accessibility routes', () => {
  for (const path of [
    '../website/app/(site)/impressum/page.tsx',
    '../website/app/(site)/privacy/page.tsx',
    '../website/app/(site)/de/impressum/page.tsx',
    '../website/app/(site)/de/datenschutz/page.tsx',
    '../website/app/(site)/accessibility/page.tsx',
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
  const distributionBuild = check.indexOf('npm run build:dist')
  const apiCheck = check.indexOf('npm run test:api')

  assert.ok(distributionBuild >= 0, 'check builds declarations')
  assert.ok(apiCheck >= 0, 'check validates the generated API')
  assert.ok(
    distributionBuild < apiCheck,
    'check builds declarations before validating the generated API',
  )

  const websiteBuild = packageJson.scripts['build:website']
  const declarations = websiteBuild.indexOf('npm run build:dist')
  const manifest = websiteBuild.indexOf('npm run generate:api')
  const evidence = websiteBuild.indexOf(
    'node scripts/write-website-evidence.mjs',
  )
  const nextBuild = websiteBuild.indexOf('next build website')

  assert.ok(declarations >= 0, 'build:website builds declarations')
  assert.ok(manifest >= 0, 'build:website regenerates the API manifest')
  assert.ok(evidence >= 0, 'build:website writes website evidence')
  assert.ok(nextBuild >= 0, 'build:website builds the website')
  assert.ok(declarations < manifest, 'declarations build before the manifest')
  assert.ok(manifest < evidence, 'the manifest regenerates before evidence')
  assert.ok(evidence < nextBuild, 'evidence writes before the Next.js build')
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
