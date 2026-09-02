import { describe, expect, it, vi } from 'vitest'
import { createMotionAdapter } from './motion-adapter.js'

describe('createMotionAdapter', () => {
  it('settles immediately when reduced motion is requested', () => {
    const driver = vi.fn()
    const onUpdate = vi.fn()
    const onComplete = vi.fn()
    const adapter = createMotionAdapter(driver)

    const handle = adapter.start({
      from: 500,
      to: 200,
      velocity: -1,
      reducedMotion: true,
      onUpdate,
      onComplete,
    })

    expect(driver).not.toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledWith(200)
    expect(onComplete).toHaveBeenCalledOnce()
    expect(() => handle.stop()).not.toThrow()
  })

  it('maps the library request to the animation driver', () => {
    const stop = vi.fn()
    const driver = vi.fn(() => ({ stop }))
    const onUpdate = vi.fn()
    const onComplete = vi.fn()
    const adapter = createMotionAdapter(driver)

    const handle = adapter.start({
      from: 500,
      to: 200,
      velocity: -1.25,
      reducedMotion: false,
      onUpdate,
      onComplete,
    })

    expect(driver).toHaveBeenCalledWith(
      500,
      200,
      expect.objectContaining({
        type: 'spring',
        velocity: -1250,
        onUpdate,
        onComplete,
      }),
    )
    handle.stop()
    expect(stop).toHaveBeenCalledOnce()
  })
})
