import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'rsbs-package-'))
let tarball

try {
  const packResult = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--ignore-scripts'], {
      cwd: packageRoot,
      encoding: 'utf8',
    })
  )[0]
  tarball = join(packageRoot, packResult.filename)
  const paths = packResult.files.map(({ path }) => path)

  assert.ok(paths.includes('dist/index.js'))
  assert.ok(paths.includes('dist/index.mjs'))
  assert.ok(!paths.some((path) => path.endsWith('.tsbuildinfo')))

  execFileSync('npm', ['init', '--yes'], {
    cwd: temporaryDirectory,
    stdio: 'ignore',
  })
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', 'react@18.3.1', 'react-dom@18.3.1', tarball],
    {
      cwd: temporaryDirectory,
      stdio: 'inherit',
    }
  )

  for (const filename of ['consumer-cjs.cjs', 'consumer-esm.mjs']) {
    copyFileSync(join(packageRoot, 'test/package', filename), join(temporaryDirectory, filename))
    execFileSync('node', [filename], {
      cwd: temporaryDirectory,
      stdio: 'inherit',
    })
  }

  JSON.parse(readFileSync(join(temporaryDirectory, 'package.json'), 'utf8'))
} finally {
  if (tarball) rmSync(tarball, { force: true })
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
