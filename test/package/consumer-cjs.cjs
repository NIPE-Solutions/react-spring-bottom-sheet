const assert = require('node:assert/strict')

const library = require('@nipe-solutions/react-spring-bottom-sheet')

assert.ok(library.BottomSheet, 'CommonJS entry must export BottomSheet')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/style.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/dist/style.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/defaults.json')
