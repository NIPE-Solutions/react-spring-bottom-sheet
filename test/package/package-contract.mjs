const requiredPackedFiles = [
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

const requiredPackedFileSet = new Set(requiredPackedFiles)

export function validatePackedFiles(paths) {
  const errors = paths
    .filter((path) => !requiredPackedFileSet.has(path))
    .map((path) => `packed package contains unexpected file: ${path}`)

  for (const path of requiredPackedFiles) {
    if (!paths.includes(path)) {
      errors.push(`packed package is missing required file: ${path}`)
    }
  }

  return errors
}

export function verifyInstalledMetadata(metadata, sourceMetadata) {
  const errors = []

  if (metadata.name !== sourceMetadata.name) {
    errors.push('installed package name must match source package name')
  }
  if (metadata.version !== sourceMetadata.version) {
    errors.push('installed package version must match source package version')
  }
  if (!sameJson(metadata.engines, sourceMetadata.engines)) {
    errors.push('installed package engines must match source package engines')
  }
  if (!sameJson(metadata.peerDependencies, sourceMetadata.peerDependencies)) {
    errors.push(
      'installed package peerDependencies must match source package peerDependencies',
    )
  }
  if (!sameJson(metadata.exports, sourceMetadata.exports)) {
    errors.push('installed package exports must match source package exports')
  }
  if (!sameJson(metadata.sideEffects, sourceMetadata.sideEffects)) {
    errors.push(
      'installed package sideEffects must match source package sideEffects',
    )
  }
  if (!sameJson(metadata.publishConfig, sourceMetadata.publishConfig)) {
    errors.push(
      'installed package publishConfig must match source package publishConfig',
    )
  }
  if (
    !sameDependencyNames(metadata.dependencies, sourceMetadata.dependencies)
  ) {
    errors.push(
      'installed package runtime dependency names must match source package dependency names',
    )
  }
  if (!requiresReact19(metadata.peerDependencies)) {
    errors.push('installed package must require React 19')
  }

  return errors
}

function requiresReact19(peerDependencies) {
  return (
    peerDependencies?.react === '^19.0.0' &&
    peerDependencies?.['react-dom'] === '^19.0.0'
  )
}

function sameDependencyNames(left = {}, right = {}) {
  return sameJson(Object.keys(left).sort(), Object.keys(right).sort())
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}
