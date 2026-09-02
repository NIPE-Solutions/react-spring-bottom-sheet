import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

function checkCss(css) {
  const directory = mkdtempSync(join(tmpdir(), 'rsbs-website-css-'))
  const path = join(directory, 'site.css')
  writeFileSync(path, css)

  return spawnSync(process.execPath, ['scripts/check-website-css.mjs', path], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  })
}

test('accepts namespaced website selectors and custom properties', () => {
  const result = checkCss(`
    :root { --docs-canvas: #fff; }
    body { background: var(--docs-canvas); }
    .docs-header, .docs-header::before { color: #111; }
    @media (width < 40rem) { .docs-header { display: block; } }
  `)

  assert.equal(result.status, 0, result.stderr)
})

test('rejects a website class outside the docs namespace', () => {
  const result = checkCss('.header { display: flex; }')

  assert.equal(result.status, 1)
  assert.match(result.stderr, /\.header/)
})

test('rejects custom property declarations and references outside the docs namespace', () => {
  const result = checkCss(`
    :root { --canvas: #fff; }
    .docs-header { background: var(--canvas); }
  `)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /--canvas/)
})
