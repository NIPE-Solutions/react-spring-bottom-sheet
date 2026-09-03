import type { Ref, RefCallback } from 'react'

type RefCleanup = () => void

function assignRef<T>(
  ref: Ref<T> | undefined,
  value: T | null,
): RefCleanup | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(value)
    if (value === null) return undefined
    return typeof cleanup === 'function' ? cleanup : () => ref(null)
  }
  if (ref) {
    ref.current = value
    if (value !== null) return () => (ref.current = null)
  }
  return undefined
}

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (value) => {
    const cleanups = refs
      .map((ref) => assignRef(ref, value))
      .filter((cleanup): cleanup is RefCleanup => cleanup !== undefined)
    if (value !== null && cleanups.length > 0)
      return () => {
        for (const cleanup of cleanups) cleanup()
      }
  }
}
