import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect, test } from 'vitest'

const websiteRoot = resolve(process.cwd(), 'website')
const canonicalTokenRenderer = join(
  websiteRoot,
  'components/source-code/CodeTokens.tsx',
)

function productionTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '.next' || entry.name === 'out'
        ? []
        : productionTsxFiles(path)
    }

    return entry.isFile() &&
      path.endsWith('.tsx') &&
      !/\.(?:test|spec)\.tsx$/.test(path) &&
      path !== canonicalTokenRenderer
      ? [path]
      : []
  })
}

test('production website TSX delegates block code rendering to CodeTokens', () => {
  for (const file of productionTsxFiles(websiteRoot)) {
    expect(readFileSync(file, 'utf8'), file).not.toMatch(/<pre(?:\s|>)/)
  }
})
