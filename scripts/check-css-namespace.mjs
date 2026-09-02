import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

function violation(code, node, detail) {
  return {
    code,
    detail,
    line: node.source?.start?.line ?? 1,
    column: node.source?.start?.column ?? 1,
  }
}

function insideKeyframes(rule) {
  let parent = rule.parent
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return true
    parent = parent.parent
  }
  return false
}

export function validateCssNamespace(css, from = '<css>') {
  const root = postcss.parse(css, { from })
  const violations = []

  root.walkRules((rule) => {
    if (insideKeyframes(rule)) return
    const selectors = selectorParser().astSync(rule.selector)

    selectors.walkTags((node) => {
      violations.push(violation('type-selector', rule, node.value))
    })
    selectors.walkUniversals(() => {
      violations.push(violation('universal-selector', rule, '*'))
    })
    selectors.walkClasses((node) => {
      if (!node.value.startsWith('rsbs-')) {
        violations.push(violation('unprefixed-class', rule, node.value))
      }
    })
    selectors.walkIds((node) => {
      if (!node.value.startsWith('rsbs-')) {
        violations.push(violation('unprefixed-id', rule, node.value))
      }
    })
    selectors.walkAttributes((node) => {
      if (!node.attribute.startsWith('data-rsbs-')) {
        violations.push(violation('unprefixed-attribute', rule, node.attribute))
      }
    })
  })

  root.walkDecls((declaration) => {
    if (
      declaration.prop.startsWith('--') &&
      !declaration.prop.startsWith('--rsbs-')
    ) {
      violations.push(
        violation('unprefixed-custom-property', declaration, declaration.prop),
      )
    }

    for (const match of declaration.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const property = match[1]
      if (property && !property.startsWith('--rsbs-')) {
        violations.push(
          violation(
            'unprefixed-custom-property-reference',
            declaration,
            property,
          ),
        )
      }
    }
  })

  return violations
}

async function main(paths) {
  let failed = false
  for (const path of paths) {
    const css = await readFile(path, 'utf8')
    for (const item of validateCssNamespace(css, path)) {
      failed = true
      console.error(
        `${path}:${item.line}:${item.column} ${item.code}: ${item.detail}`,
      )
    }
  }
  if (failed) process.exitCode = 1
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main(process.argv.slice(2))
}
