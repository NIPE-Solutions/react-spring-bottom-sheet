import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import postcss from 'postcss'

const websiteCss = postcss.parse(
  readFileSync(new URL('../website/app/site.css', import.meta.url), 'utf8'),
)

function declarationsFor(selector, mediaQuery) {
  const declarations = new Map()

  websiteCss.walkRules(selector, (rule) => {
    let ancestor = rule.parent
    let media
    while (ancestor) {
      if (ancestor.type === 'atrule' && ancestor.name === 'media') {
        media = ancestor.params
        break
      }
      ancestor = ancestor.parent
    }
    if (media !== mediaQuery) return
    rule.walkDecls((declaration) => {
      declarations.set(declaration.prop, declaration.value)
    })
  })

  return declarations
}

function declarationValuesFor(selector, property, mediaQuery) {
  const values = []

  websiteCss.walkRules(selector, (rule) => {
    let ancestor = rule.parent
    let media
    while (ancestor) {
      if (ancestor.type === 'atrule' && ancestor.name === 'media') {
        media = ancestor.params
        break
      }
      ancestor = ancestor.parent
    }
    if (media !== mediaQuery) return
    rule.walkDecls(property, (declaration) => values.push(declaration.value))
  })

  return values
}

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

test('accepts the documented device frame custom properties', () => {
  const result = checkCss(`
    .docs-device-frame {
      --device-width: 390px;
      --device-height: 780px;
      --device-scale: 1;
      --device-radius: 1rem;
      width: calc(var(--device-width) * var(--device-scale));
      border-radius: var(--device-radius);
    }
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

test('source inspector owns horizontal overflow and accessible line-number presentation', () => {
  const source = declarationsFor('.docs-source-inspector pre')
  const line = declarationsFor('.docs-source-inspector [data-line]')
  const number = declarationsFor(
    '.docs-source-inspector [data-code-line-numbers]',
  )

  assert.equal(source.get('overflow-x'), 'auto')
  assert.equal(source.get('max-width'), '100%')
  assert.equal(source.get('white-space'), 'pre')
  assert.equal(line.get('min-width'), 'max-content')
  assert.equal(number.get('user-select'), 'none')
  assert.equal(number.get('font-variant-numeric'), 'tabular-nums')
})

test('wide source inspector overlays the inline end without reflowing preview', () => {
  const layer = declarationsFor('.docs-source-inspector')
  const panel = declarationsFor('.docs-source-inspector-panel')
  const closedPanel = declarationsFor(
    ".docs-source-inspector[data-state='closed'] .docs-source-inspector-panel",
  )
  const openPanel = declarationsFor(
    ".docs-source-inspector[data-state='open'] .docs-source-inspector-panel",
  )

  assert.equal(layer.get('position'), 'fixed')
  assert.equal(layer.get('inset'), '0')
  assert.equal(panel.get('width'), 'min(48rem, 72vw)')
  assert.match(panel.get('transition'), /^transform /)
  assert.equal(closedPanel.get('transform'), 'translateX(100%)')
  assert.equal(openPanel.get('transform'), 'translateX(0)')
})

test('compact inspector fills the viewport with safe-area padding', () => {
  const controls = declarationsFor(
    '.docs-device-controls',
    '(max-width: 809px)',
  )
  const panel = declarationsFor(
    '.docs-source-inspector-panel',
    '(max-width: 809px)',
  )
  const header = declarationsFor(
    '.docs-source-inspector-header',
    '(max-width: 809px)',
  )

  assert.equal(controls.get('flex-wrap'), 'wrap')
  assert.equal(panel.get('width'), '100%')
  assert.deepEqual(
    declarationValuesFor('.docs-source-inspector-panel', 'height'),
    ['100vh', '100dvh'],
  )
  assert.equal(panel.get('height'), '100dvh')
  assert.match(header.get('padding-top'), /env\(safe-area-inset-top\)/)
  assert.match(header.get('padding-inline'), /safe-area-inset/)
})

test('source inspector removes its transform transition for reduced motion', () => {
  const panel = declarationsFor(
    '.docs-source-inspector-panel',
    '(prefers-reduced-motion: reduce)',
  )

  assert.equal(panel.get('transition'), 'none')
})
