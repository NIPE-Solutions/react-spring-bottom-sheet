import { describe, expect, it, vi } from 'vitest'
import type { RefCallback } from 'react'
import { mergeRefs } from './merge-refs.js'

describe('mergeRefs', () => {
  it('runs callback-ref cleanup functions when the merged ref detaches', () => {
    const firstCleanup = vi.fn()
    const secondCleanup = vi.fn()
    const ref = mergeRefs<HTMLElement>(
      () => firstCleanup,
      () => secondCleanup,
    ) as RefCallback<HTMLElement>

    const cleanup = ref(document.createElement('div'))
    expect(cleanup).toBeTypeOf('function')

    cleanup?.()
    expect(firstCleanup).toHaveBeenCalledOnce()
    expect(secondCleanup).toHaveBeenCalledOnce()
  })
})
