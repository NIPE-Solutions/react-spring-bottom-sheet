import assert from 'node:assert/strict'
import test from 'node:test'
import { checkBudget } from './check-bundle-size.mjs'

test('accepts an artifact within its raw and compressed budgets', () => {
  assert.doesNotThrow(() =>
    checkBudget('index.js', Buffer.from('export const value = 1'), {
      raw: 64,
      gzip: 64,
    }),
  )
})

test('reports which budget an artifact exceeds', () => {
  assert.throws(
    () => checkBudget('index.js', Buffer.alloc(65), { raw: 64, gzip: 64 }),
    /index\.js raw size 65 B exceeds 64 B/,
  )
})
