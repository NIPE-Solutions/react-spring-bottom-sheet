import { describe, expect, it } from 'vitest'
import { getInitialMaxHeight } from './useSnapPoints'

describe('getInitialMaxHeight', () => {
  it('prefers a controlled maximum height on the first render', () => {
    expect(getInitialMaxHeight(320, 844)).toBe(320)
  })

  it('uses the viewport height when the prop is absent', () => {
    expect(getInitialMaxHeight(undefined, 844)).toBe(844)
  })
})
