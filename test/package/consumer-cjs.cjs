const assert = require('node:assert/strict')

const library = require('@nipe-solutions/react-spring-bottom-sheet')

assert.equal(
  typeof library.Sheet.Root,
  'function',
  'CommonJS entry must export Sheet.Root',
)
assert.equal(
  typeof library.BottomSheet,
  'function',
  'CommonJS entry must export BottomSheet',
)
require.resolve('@nipe-solutions/react-spring-bottom-sheet/core.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/theme.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/tokens.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/styles.css')
