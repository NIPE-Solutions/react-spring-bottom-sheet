import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCssNamespace } from './check-css-namespace.mjs'

test('accepts namespaced selectors and custom properties', () => {
  assert.deepEqual(
    validateCssNamespace(`
      @layer rsbs.core {
        :where(.rsbs-content)[data-rsbs-state='open'] {
          --rsbs-position: 0px;
          transform: translateY(var(--rsbs-position));
        }
      }
    `),
    [],
  )
})

test('rejects selectors outside the rsbs namespace', () => {
  const violations = validateCssNamespace(`
    button, .content, *, [data-state='open'] { color: red }
  `)

  assert.deepEqual(
    violations.map(({ code }) => code).sort(),
    [
      'type-selector',
      'unprefixed-class',
      'universal-selector',
      'unprefixed-attribute',
    ].sort(),
  )
})

test('rejects unprefixed custom property declarations and references', () => {
  const violations = validateCssNamespace(`
    .rsbs-content {
      --position: 0px;
      transform: translateY(var(--position));
    }
  `)

  assert.deepEqual(
    violations.map(({ code }) => code),
    ['unprefixed-custom-property', 'unprefixed-custom-property-reference'],
  )
})

test('allows keyframe selectors but validates declarations within them', () => {
  assert.deepEqual(
    validateCssNamespace(`
      @keyframes rsbs-enter {
        from { opacity: 0 }
        to { opacity: 1 }
      }
    `),
    [],
  )
})

test('accepts isolated recipe themes and rejects website selector leakage', () => {
  assert.deepEqual(
    validateCssNamespace(`
      .rsbs-example-field-note.rsbs-content {
        --rsbs-example-field-note-accent: #1646d8;
        color: var(--rsbs-example-field-note-accent);
      }
    `),
    [],
  )

  assert.deepEqual(
    validateCssNamespace(`.docs-page .rsbs-content { color: red }`).map(
      ({ code }) => code,
    ),
    ['unprefixed-class'],
  )
})
