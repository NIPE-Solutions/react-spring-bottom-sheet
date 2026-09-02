import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  validatePackedFiles,
  verifyInstalledMetadata,
} from './package-contract.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const sourceMetadata = JSON.parse(
  readFileSync(join(packageRoot, 'package.json'), 'utf8'),
)
const expectedReactVersion = sourceMetadata.devDependencies.react.replace(
  /^[~^]/,
  '',
)
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'rsbs-package-'))
let tarball

try {
  const packResult = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--ignore-scripts'], {
      cwd: packageRoot,
      encoding: 'utf8',
    }),
  )[0]
  tarball = join(packageRoot, packResult.filename)
  assert.deepEqual(
    validatePackedFiles(packResult.files.map(({ path }) => path)),
    [],
  )

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
      `typescript@${sourceMetadata.devDependencies.typescript.replace(/^[~^]/, '')}`,
      `@types/react@${sourceMetadata.devDependencies['@types/react'].replace(/^[~^]/, '')}`,
      tarball,
    ],
    {
      cwd: temporaryDirectory,
      stdio: 'inherit',
    },
  )

  const temporaryRequire = createRequire(
    join(temporaryDirectory, 'package.json'),
  )
  const installedMetadata = JSON.parse(
    readFileSync(
      temporaryRequire.resolve(`${sourceMetadata.name}/package.json`),
      'utf8',
    ),
  )
  assert.deepEqual(
    verifyInstalledMetadata(installedMetadata, sourceMetadata),
    [],
  )

  const coreCss = readFileSync(
    temporaryRequire.resolve(`${sourceMetadata.name}/core.css`),
    'utf8',
  )
  const themeCss = readFileSync(
    temporaryRequire.resolve(`${sourceMetadata.name}/theme.css`),
    'utf8',
  )
  const combinedCss = readFileSync(
    temporaryRequire.resolve(`${sourceMetadata.name}/styles.css`),
    'utf8',
  )
  assert.match(coreCss, /@layer rsbs\.core/)
  assert.doesNotMatch(coreCss, /--rsbs-content-background|box-shadow/)
  assert.match(themeCss, /@import ['"]\.\/tokens\.css['"]/)
  assert.ok(
    combinedCss.indexOf("@import './core.css'") <
      combinedCss.indexOf("@import './theme.css'"),
    'combined styles must load core mechanics before the theme',
  )
  assert.doesNotMatch(`${coreCss}${themeCss}`, /!important/)

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
} finally {
  if (tarball) rmSync(tarball, { force: true })
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
