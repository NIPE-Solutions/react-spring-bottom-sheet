import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const budgets = {
  'dist/index.js': { raw: 40_000, gzip: 12_000 },
  'dist/core.css': { raw: 2_000, gzip: 700 },
  'dist/theme.css': { raw: 1_500, gzip: 600 },
  'dist/tokens.css': { raw: 2_000, gzip: 700 },
  'dist/styles.css': { raw: 256, gzip: 256 },
}

export function checkBudget(name, contents, budget) {
  const sizes = {
    raw: contents.byteLength,
    gzip: gzipSync(contents).byteLength,
  }
  for (const kind of ['raw', 'gzip']) {
    if (sizes[kind] > budget[kind]) {
      throw new Error(
        `${name} ${kind} size ${sizes[kind]} B exceeds ${budget[kind]} B`,
      )
    }
  }
  return sizes
}

export function checkBundleSizes() {
  for (const [name, budget] of Object.entries(budgets)) {
    const sizes = checkBudget(name, readFileSync(name), budget)
    process.stdout.write(`${name}: ${sizes.raw} B raw, ${sizes.gzip} B gzip\n`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) checkBundleSizes()
