import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'rsbs-package-'))
const expectedReactVersion = '19.2.8'
let tarball

try {
  const packResult = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--ignore-scripts'], {
      cwd: packageRoot,
      encoding: 'utf8',
    }),
  )[0]
  tarball = join(packageRoot, packResult.filename)
  const paths = packResult.files.map(({ path }) => path)

  for (const path of [
    'dist/index.cjs',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/core.css',
    'dist/theme.css',
    'dist/styles.css',
  ]) {
    assert.ok(paths.includes(path), `packed package must include ${path}`)
  }
  assert.ok(
    !paths.some((path) =>
      /^(dist\/(favicon|readme)|dist\/somecard)/.test(path),
    ),
    'packed library must not include website assets',
  )
  assert.ok(!paths.some((path) => path.endsWith('.tsbuildinfo')))

  execFileSync('npm', ['init', '--yes'], {
    cwd: temporaryDirectory,
    stdio: 'ignore',
  })
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      `react@${expectedReactVersion}`,
      `react-dom@${expectedReactVersion}`,
      'typescript@6.0.3',
      '@types/react@19.2.18',
      tarball,
    ],
    {
      cwd: temporaryDirectory,
      stdio: 'inherit',
    },
  )

  for (const filename of ['consumer-cjs.cjs', 'consumer-esm.mjs']) {
    copyFileSync(
      join(packageRoot, 'test/package', filename),
      join(temporaryDirectory, filename),
    )
    execFileSync('node', [filename], {
      cwd: temporaryDirectory,
      stdio: 'inherit',
    })
  }

  copyFileSync(
    join(packageRoot, 'test/package', 'consumer-types.ts'),
    join(temporaryDirectory, 'consumer-types.ts'),
  )

  execFileSync(
    'npx',
    [
      'tsc',
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      'consumer-types.ts',
    ],
    { cwd: temporaryDirectory, stdio: 'inherit' },
  )

  const installedReactVersion = execFileSync(
    'node',
    ['-p', "require('react/package.json').version"],
    { cwd: temporaryDirectory, encoding: 'utf8' },
  ).trim()
  assert.equal(installedReactVersion, expectedReactVersion)

  JSON.parse(readFileSync(join(temporaryDirectory, 'package.json'), 'utf8'))
} finally {
  if (tarball) rmSync(tarball, { force: true })
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
