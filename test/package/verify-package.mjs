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
    'dist/tokens.css',
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

  const coreCss = readFileSync(join(packageRoot, 'dist/core.css'), 'utf8')
  const themeCss = readFileSync(join(packageRoot, 'dist/theme.css'), 'utf8')
  const combinedCss = readFileSync(join(packageRoot, 'dist/styles.css'), 'utf8')
  assert.match(coreCss, /@layer rsbs\.core/)
  assert.doesNotMatch(coreCss, /--rsbs-content-background|box-shadow/)
  assert.match(themeCss, /@import ['"]\.\/tokens\.css['"]/)
  assert.ok(
    combinedCss.indexOf("@import './core.css'") <
      combinedCss.indexOf("@import './theme.css'"),
    'combined styles must load core mechanics before the theme',
  )
  assert.doesNotMatch(`${coreCss}${themeCss}`, /!important/)

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
    join(packageRoot, 'test/package', 'consumer-types.tsx'),
    join(temporaryDirectory, 'consumer-types.tsx'),
  )
  copyFileSync(
    join(packageRoot, 'test/package', 'tsconfig.json'),
    join(temporaryDirectory, 'tsconfig.json'),
  )

  execFileSync('npm', ['exec', '--', 'tsc', '--project', 'tsconfig.json'], {
    cwd: temporaryDirectory,
    stdio: 'inherit',
  })

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
