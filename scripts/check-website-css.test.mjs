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

function selectorsMatching(pattern) {
  const selectors = []

  websiteCss.walkRules((rule) => {
    for (const selector of rule.selectors ?? []) {
      if (pattern.test(selector)) selectors.push(selector)
    }
  })

  return selectors
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

test('shared code blocks own a square, non-wrapping, internally scrolling surface', () => {
  const block = declarationsFor('.docs-code-block')
  const source = declarationsFor('.docs-code-block pre')
  const code = declarationsFor('.docs-code-block code')
  const line = declarationsFor('.docs-code-block [data-line]')
  const focus = declarationsFor('.docs-code-block pre:focus-visible')

  assert.equal(block.get('min-width'), '0')
  assert.equal(block.get('max-width'), '100%')
  assert.equal(block.get('overflow'), 'hidden')
  assert.equal(block.get('border-radius'), '0')
  assert.equal(source.get('width'), '100%')
  assert.equal(source.get('max-width'), '100%')
  assert.equal(source.get('overflow-x'), 'auto')
  assert.equal(source.get('white-space'), 'pre')
  assert.equal(source.get('border-radius'), '0')
  assert.equal(code.get('display'), 'inline-block')
  assert.equal(code.get('vertical-align'), 'top')
  assert.equal(line.get('min-width'), 'max-content')
  assert.match(focus.get('outline'), /^3px solid /)
})

test('migrated homepage code wrappers retain launch and quick-start sizing', () => {
  const launch = declarationsFor('.docs-launch-actions .docs-code-block')
  const quickStart = declarationsFor('.docs-quick-start-code')
  const quickStartSource = declarationsFor('.docs-quick-start-code pre')

  assert.equal(launch.get('flex-basis'), '100%')
  assert.equal(launch.get('min-width'), '0')
  assert.equal(launch.get('width'), '100%')
  assert.equal(quickStart.get('min-width'), '0')
  assert.equal(quickStart.get('width'), '100%')
  assert.equal(quickStartSource.get('max-height'), '34rem')
  assert.equal(quickStartSource.get('overflow-y'), 'auto')
})

test('recipe workbench keeps one centered laboratory measure', () => {
  const heading = declarationsFor('.docs-recipe-section-heading')
  const lab = declarationsFor('.docs-device-lab')
  const guidance = declarationsFor('.docs-recipe-guidance')

  assert.equal(heading.get('align-items'), 'center')
  assert.equal(heading.get('max-width'), '76rem')
  assert.equal(heading.get('margin-inline'), 'auto')
  assert.equal(lab.get('max-width'), '76rem')
  assert.equal(lab.get('margin-inline'), 'auto')
  assert.equal(guidance.get('max-width'), '76rem')
  assert.equal(guidance.get('margin-inline'), 'auto')
})

test('obsolete permanent recipe source and details selectors stay removed', () => {
  assert.deepEqual(
    selectorsMatching(
      /(^|[\s,>+~])\.docs-recipe-(?:source|notes)(?=$|[\s,.#:[>+~])/,
    ),
    [],
  )
  assert.deepEqual(selectorsMatching(/\.docs-recipe-page\s+details/), [])
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
  const backdrop = declarationsFor('.docs-source-inspector-backdrop')
  const panel = declarationsFor('.docs-source-inspector-panel')
  const closedBackdrop = declarationsFor(
    ".docs-source-inspector[data-state='closed'] .docs-source-inspector-backdrop",
  )
  const openBackdrop = declarationsFor(
    ".docs-source-inspector[data-state='open'] .docs-source-inspector-backdrop",
  )
  const closedPanel = declarationsFor(
    ".docs-source-inspector[data-state='closed'] .docs-source-inspector-panel",
  )
  const openPanel = declarationsFor(
    ".docs-source-inspector[data-state='open'] .docs-source-inspector-panel",
  )

  assert.equal(layer.get('position'), 'fixed')
  assert.equal(layer.get('inset'), '0')
  assert.equal(panel.get('width'), 'min(48rem, 72vw)')
  assert.equal(panel.get('transition-property'), 'transform')
  assert.equal(backdrop.get('transition-property'), 'opacity')
  assert.equal(closedBackdrop.get('opacity'), '0')
  assert.equal(openBackdrop.get('opacity'), '1')
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
  const backdrop = declarationsFor(
    '.docs-source-inspector-backdrop',
    '(prefers-reduced-motion: reduce)',
  )

  assert.equal(panel.get('transition'), 'none')
  assert.equal(backdrop.get('transition'), 'none')
})
