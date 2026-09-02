import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { BottomSheet } from '@nipe-solutions/react-spring-bottom-sheet'

const require = createRequire(import.meta.url)

assert.ok(BottomSheet, 'ES module entry must export BottomSheet')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/style.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/dist/style.css')
require.resolve('@nipe-solutions/react-spring-bottom-sheet/defaults.json')
