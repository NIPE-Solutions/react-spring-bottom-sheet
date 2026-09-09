import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JSAnimation } from 'motion'
import { createMotionAdapter } from './motion-adapter.js'

type FrameCallback = (timestamp: number) => void

describe('spring driver', () => {
  let now: number
  let nextId: number
  let frames: Map<number, FrameCallback>

  beforeEach(() => {
    now = 1000
    nextId = 0
    frames = new Map()
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => {
      frames.set(++nextId, callback)
      return nextId
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function frame(elapsed: number) {
    now = 1000 + elapsed
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(now))
    await Promise.resolve()
  }

  function start(overrides = {}) {
    const request = {
      from: 500,
      to: 200,
      velocity: -1.25,
      reducedMotion: false,
      onUpdate: vi.fn(),
      onComplete: vi.fn(),
      ...overrides,
    }
    return { ...request, handle: createMotionAdapter().start(request) }
  }

  // The reference is Motion's existing numeric animation engine, not the
  // generator used by the replacement. Catch changes to units, physics,
  // rounding, final position, and completion time at different frame rates.
  it.each([
    [500, 200, -1.25, 1000 / 60],
    [200, 800, 2, 1000 / 120],
    [500, 200, 3, 1000 / 30],
    [200, 202, 0, 1000 / 60],
    [200, 200, 0, 1000 / 60],
    [200, 200, 1, 1000 / 60],
  ])(
    'matches Motion from %s to %s at velocity %s and frame interval %s',
    async (from, to, velocity, interval) => {
      const referenceUpdate = vi.fn()
      const referenceComplete = vi.fn()
      const reference = new JSAnimation({
        keyframes: [from, to],
        type: 'spring',
        velocity: velocity * 1000,
        stiffness: 380,
        damping: 38,
        onUpdate: referenceUpdate,
        onComplete: referenceComplete,
        driver: () => ({ start() {}, stop() {}, now: () => now }),
      })
      const actual = start({ from, to, velocity })
      for (let elapsed = interval; elapsed < 3000; elapsed += interval) {
        reference.tick(1000 + elapsed)
        await frame(elapsed)
        expect(actual.onUpdate.mock.lastCall?.[0]).toBeCloseTo(
          referenceUpdate.mock.lastCall![0],
          8,
        )
        expect(actual.onComplete.mock.calls.length).toBe(
          referenceComplete.mock.calls.length,
        )
        if (referenceComplete.mock.calls.length) break
      }
      expect(actual.onComplete).toHaveBeenCalledOnce()
      expect(actual.onUpdate).toHaveBeenLastCalledWith(to)
      expect(frames.size).toBe(0)
      reference.stop()
    },
  )

  it('cancels before the first frame without updates or completion', async () => {
    const actual = start()
    actual.handle.stop()
    actual.handle.stop()
    await frame(1000)
    expect(actual.onUpdate).not.toHaveBeenCalled()
    expect(actual.onComplete).not.toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })

  it('reverses from the last position without stale completion', async () => {
    const opening = start()
    await frame(100)
    const position = opening.onUpdate.mock.lastCall![0]
    opening.handle.stop()
    const count = opening.onUpdate.mock.calls.length
    const closing = start({ from: position, to: 800, velocity: 0 })
    await frame(116)
    expect(closing.onUpdate.mock.lastCall![0]).toBeGreaterThan(position)
    await frame(2000)
    expect(opening.onUpdate).toHaveBeenCalledTimes(count)
    expect(opening.onComplete).not.toHaveBeenCalled()
    expect(closing.onComplete).toHaveBeenCalledOnce()
    expect(closing.onUpdate).toHaveBeenLastCalledWith(800)
  })

  it('settles once after a long background pause', async () => {
    const actual = start()
    await frame(16)
    await frame(60_000)
    await frame(60_016)
    expect(actual.onComplete).toHaveBeenCalledOnce()
    expect(actual.onUpdate).toHaveBeenLastCalledWith(200)
    expect(frames.size).toBe(0)
  })

  it('starts at the origin if the first frame timestamp precedes startup', async () => {
    const actual = start()
    await frame(-5)
    expect(actual.onUpdate).toHaveBeenLastCalledWith(500)
    await frame(11)
    expect(actual.onUpdate.mock.lastCall![0]).toBeLessThan(500)
    actual.handle.stop()
  })

  it('ignores a frame callback delivered after cancellation', () => {
    const actual = start()
    const pending = [...frames.values()][0]!
    actual.handle.stop()
    pending(1016)
    expect(actual.onUpdate).not.toHaveBeenCalled()
    expect(actual.onComplete).not.toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })

  it.each([16, 2000])(
    'honors cancellation from an update at %s ms',
    async (elapsed) => {
      const onComplete = vi.fn()
      const handle = createMotionAdapter().start({
        from: 500,
        to: 200,
        velocity: 0,
        reducedMotion: false,
        onUpdate: () => handle.stop(),
        onComplete,
      })
      await frame(elapsed)
      await frame(3000)
      expect(onComplete).not.toHaveBeenCalled()
      expect(frames.size).toBe(0)
    },
  )

  it('suppresses queued completion when stopped after the final update', async () => {
    const actual = start()
    now = 3000
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(now))
    expect(actual.onUpdate).toHaveBeenLastCalledWith(200)
    expect(actual.onComplete).not.toHaveBeenCalled()
    actual.handle.stop()
    await Promise.resolve()
    expect(actual.onComplete).not.toHaveBeenCalled()
  })

  it('completes reduced motion synchronously without scheduling frames', () => {
    const actual = start({ reducedMotion: true })
    expect(actual.onUpdate).toHaveBeenCalledExactlyOnceWith(200)
    expect(actual.onComplete).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
  })
})
