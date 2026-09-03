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

test('recipe source owns horizontal overflow and accessible line-number presentation', () => {
  const source = declarationsFor('.docs-recipe-source pre')
  const line = declarationsFor('.docs-recipe-source [data-line]')
  const number = declarationsFor(
    ".docs-recipe-source [data-line] > [aria-hidden='true']",
  )

  assert.equal(source.get('overflow-x'), 'auto')
  assert.equal(source.get('max-width'), '100%')
  assert.equal(line.get('min-width'), 'max-content')
  assert.equal(number.get('user-select'), 'none')
  assert.equal(number.get('font-variant-numeric'), 'tabular-nums')
})

test('wide recipe layout balances preview and source without fixed-width overflow', () => {
  const recipePage = declarationsFor('.docs-recipe-page', '(min-width: 90rem)')
  const preview = declarationsFor('.docs-recipe-preview', '(min-width: 90rem)')
  const source = declarationsFor('.docs-recipe-source', '(min-width: 90rem)')

  assert.equal(recipePage.get('display'), 'grid')
  assert.match(recipePage.get('grid-template-columns'), /minmax\(0,/)
  assert.equal(preview.get('grid-column'), '1')
  assert.equal(source.get('grid-column'), '2')
  assert.equal(source.get('min-width'), '0')
})

test('compact recipe controls wrap while recipe sections return to document flow', () => {
  const controls = declarationsFor(
    '.docs-device-controls',
    '(max-width: 809px)',
  )
  const recipePage = declarationsFor('.docs-recipe-page', '(max-width: 809px)')
  const source = declarationsFor('.docs-recipe-source', '(max-width: 809px)')

  assert.equal(controls.get('flex-wrap'), 'wrap')
  assert.equal(recipePage.get('display'), 'block')
  assert.equal(source.get('min-width'), '0')
})
