const assert = require('node:assert/strict')

const library = require('@nipe-solutions/react-spring-bottom-sheet')

assert.equal(typeof library, 'object', 'CommonJS entry must load')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/core.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/theme.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/styles.css')
