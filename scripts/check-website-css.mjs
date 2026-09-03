import { readFileSync } from 'node:fs'
import process from 'node:process'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

const paths = process.argv.slice(2)
const DEVICE_FRAME_PROPERTIES = new Set([
  '--device-width',
  '--device-height',
  '--device-scale',
  '--device-radius',
])

function isAllowedCustomProperty(property) {
  return property.startsWith('--docs-') || DEVICE_FRAME_PROPERTIES.has(property)
}

if (paths.length === 0) {
  console.error('Usage: node scripts/check-website-css.mjs <stylesheet...>')
  process.exitCode = 1
} else {
  const errors = []

  for (const path of paths) {
    const root = postcss.parse(readFileSync(path, 'utf8'), { from: path })

    root.walkRules((rule) => {
      selectorParser((selectors) => {
        selectors.walkClasses((className) => {
          if (!className.value.startsWith('docs-')) {
            errors.push(`${path}: selector .${className.value} must use docs-`)
          }
        })
      }).processSync(rule.selector)
    })

    root.walkDecls((declaration) => {
      if (
        declaration.prop.startsWith('--') &&
        !isAllowedCustomProperty(declaration.prop)
      ) {
        errors.push(
          `${path}: custom property ${declaration.prop} must use --docs-`,
        )
      }

      for (const match of declaration.value.matchAll(/var\((--[\w-]+)/g)) {
        if (!isAllowedCustomProperty(match[1])) {
          errors.push(`${path}: custom property ${match[1]} must use --docs-`)
        }
      }
    })
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'))
    process.exitCode = 1
  }
}
