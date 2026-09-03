import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import {
  validatePackedFiles,
  verifyInstalledMetadata,
} from './package-contract.mjs'

const require = createRequire(import.meta.url)
const sourceMetadata = require('../../package.json')

const validPaths = [
  'LICENSE',
  'README.md',
  'dist/accessibility/focus.d.ts',
  'dist/accessibility/isolation.d.ts',
  'dist/components/Backdrop.d.ts',
  'dist/components/BottomSheet.d.ts',
  'dist/components/Close.d.ts',
  'dist/components/Content.d.ts',
  'dist/components/Description.d.ts',
  'dist/components/Handle.d.ts',
  'dist/components/Portal.d.ts',
  'dist/components/Root.d.ts',
  'dist/components/Sheet.d.ts',
  'dist/components/Title.d.ts',
  'dist/components/Trigger.d.ts',
  'dist/components/Viewport.d.ts',
  'dist/composition/Slot.d.ts',
  'dist/composition/merge-refs.d.ts',
  'dist/context/sheet-context.d.ts',
  'dist/controller/create-controller.d.ts',
  'dist/controller/invariants.d.ts',
  'dist/controller/reducer.d.ts',
  'dist/controller/types.d.ts',
  'dist/core.css',
  'dist/gestures/pointer-session.d.ts',
  'dist/gestures/resistance.d.ts',
  'dist/gestures/scroll-boundary.d.ts',
  'dist/gestures/velocity.d.ts',
  'dist/hooks/use-reduced-motion.d.ts',
  'dist/hooks/use-sheet-interactions.d.ts',
  'dist/hooks/use-sheet-layout.d.ts',
  'dist/hooks/use-sheet-motion.d.ts',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'dist/layout/observe-layout.d.ts',
  'dist/layout/reconcile-active-snap-point.d.ts',
  'dist/layout/resolve-snap-points.d.ts',
  'dist/layout/select-settle-target.d.ts',
  'dist/layout/types.d.ts',
  'dist/motion/motion-adapter.d.ts',
  'dist/motion/types.d.ts',
  'dist/public-types.d.ts',
  'dist/styles.css',
  'dist/theme.css',
  'dist/tokens.css',
  'package.json',
]

test('accepts only the complete packed artifact manifest', () => {
  assert.deepEqual(validatePackedFiles(validPaths), [])
  assert.deepEqual(
    validatePackedFiles(
      validPaths.filter((path) => path !== 'dist/styles.css'),
    ),
    ['packed package is missing required file: dist/styles.css'],
  )
})

for (const path of [
  'src/index.ts',
  'test/package/consumer-esm.mjs',
  '.cache/build.json',
  'index.js.map',
  'dist/index.tsbuildinfo',
  'website/app/page.tsx',
  'NOTICE',
]) {
  test(`rejects an unapproved tarball file: ${path}`, () => {
    assert.deepEqual(validatePackedFiles([...validPaths, path]), [
      `packed package contains unexpected file: ${path}`,
    ])
  })
}

test('accepts metadata installed from the packed artifact', () => {
  assert.deepEqual(
    verifyInstalledMetadata(structuredClone(sourceMetadata), sourceMetadata),
    [],
  )
})

for (const [name, mutation, expectedError] of [
  [
    'name',
    (metadata) => ({ ...metadata, name: '@example/wrong-package' }),
    'installed package name must match source package name',
  ],
  [
    'version',
    (metadata) => ({ ...metadata, version: '0.0.0' }),
    'installed package version must match source package version',
  ],
  [
    'Node engine',
    (metadata) => ({ ...metadata, engines: { node: '>=18' } }),
    'installed package engines must match source package engines',
  ],
  [
    'React peer',
    (metadata) => ({ ...metadata, peerDependencies: { react: '^18.0.0' } }),
    'installed package must require React 19',
  ],
  [
    'exports',
    (metadata) => ({ ...metadata, exports: { '.': './dist/index.js' } }),
    'installed package exports must match source package exports',
  ],
  [
    'side effects',
    (metadata) => ({ ...metadata, sideEffects: false }),
    'installed package sideEffects must match source package sideEffects',
  ],
  [
    'runtime dependency names',
    (metadata) => ({ ...metadata, dependencies: { extra: '^1.0.0' } }),
    'installed package runtime dependency names must match source package dependency names',
  ],
  [
    'publish configuration',
    (metadata) => ({ ...metadata, publishConfig: { access: 'restricted' } }),
    'installed package publishConfig must match source package publishConfig',
  ],
]) {
  test(`rejects incorrect installed ${name} metadata`, () => {
    assert.ok(
      verifyInstalledMetadata(
        mutation(structuredClone(sourceMetadata)),
        sourceMetadata,
      ).includes(expectedError),
    )
  })
}
