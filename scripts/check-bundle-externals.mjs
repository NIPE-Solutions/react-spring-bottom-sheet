import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const esm = readFileSync('dist/index.js', 'utf8')
const cjs = readFileSync('dist/index.cjs', 'utf8')

for (const dependency of ['react', 'react-dom', 'react/jsx-runtime']) {
  assert.match(
    esm,
    new RegExp(`from ["']${dependency.replace('/', '\\/')}["']`),
    `${dependency} must remain an ESM external`,
  )
  assert.match(
    cjs,
    new RegExp(`require\\(["']${dependency.replace('/', '\\/')}["']\\)`),
    `${dependency} must remain a CommonJS external`,
  )
}

for (const contents of [esm, cjs]) {
  assert.doesNotMatch(
    contents,
    /(?:from\s*|require\s*\(\s*)["'](?:motion|framer-motion|motion-dom|motion-utils)(?:\/[^"']*)?["']/,
    'the spring implementation must be bundled without a Motion runtime dependency',
  )
}

assert.doesNotMatch(
  esm,
  /Calling `require`/,
  'the ESM artifact must not contain a CommonJS require shim',
)
