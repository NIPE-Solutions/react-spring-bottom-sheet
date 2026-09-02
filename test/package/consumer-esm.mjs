import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as library from '@nipe-solutions/react-spring-bottom-sheet'

const require = createRequire(import.meta.url)

assert.equal(typeof library, 'object', 'ES module entry must load')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/core.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/theme.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/styles.css')
