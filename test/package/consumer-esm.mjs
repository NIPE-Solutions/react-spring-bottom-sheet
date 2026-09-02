import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { Sheet } from '@nipe-solutions/react-spring-bottom-sheet'

const require = createRequire(import.meta.url)

assert.equal(
  typeof Sheet.Root,
  'function',
  'ES module entry must export Sheet.Root',
)
require.resolve('@nipe-solutions/react-spring-bottom-sheet/core.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/theme.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/tokens.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/styles.css')
