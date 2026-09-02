import { describe, expect, it } from 'vitest'
import {
  createSpringConfig,
  getPublicState,
  runSpringCallback,
} from './BottomSheet'

describe('getPublicState', () => {
  it('reports a parent state while the machine is in a nested child state', () => {
    const snapshot = {
      matches: (state: string) => state === 'opening',
    }

    expect(getPublicState(snapshot)).toBe('opening')
  })
})

describe('runSpringCallback', () => {
  it('waits for an asynchronous lifecycle callback', async () => {
    let release: () => void = () => undefined
    let completed = false
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    const callback = runSpringCallback(() => gate, { type: 'OPEN' }).then(
      () => {
        completed = true
      }
    )

    await Promise.resolve()
    expect(completed).toBe(false)

    release()
    await callback
    expect(completed).toBe(true)
  })
})

describe('createSpringConfig', () => {
  it('uses the latest consumer spring configuration', () => {
    expect(
      createSpringConfig(
        { tension: 170, friction: 26 },
        1,
        { mass: 2, tension: 210, friction: 30 }
      )
    ).toEqual({
      velocity: 1,
      mass: 2,
      tension: 210,
      friction: 30,
    })
  })
})
