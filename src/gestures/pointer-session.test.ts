import { describe, expect, it, vi } from 'vitest'
import { createPointerSession } from './pointer-session.js'

function pointer(pointerId: number, clientY: number, timeStamp = 0) {
  return { pointerId, clientY, timeStamp }
}

describe('createPointerSession', () => {
  it('captures a pointer and releases it through the shared cleanup path', () => {
    const target = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
    }
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const session = createPointerSession({ onStart, onMove: vi.fn(), onEnd })

    expect(session.start(pointer(4, 300), target)).toBe(true)
    session.end(pointer(4, 250, 20))

    expect(target.setPointerCapture).toHaveBeenCalledWith(4)
    expect(target.releasePointerCapture).toHaveBeenCalledWith(4)
    expect(onStart).toHaveBeenCalledWith(300)
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ cancelled: false }),
    )
    expect(session.active).toBe(false)
  })

  it('uses the same cleanup for cancellation and disposal', () => {
    const target = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
    }
    const onEnd = vi.fn()
    const session = createPointerSession({
      onStart: vi.fn(),
      onMove: vi.fn(),
      onEnd,
    })

    session.start(pointer(1, 100), target)
    session.cancel()
    session.start(pointer(2, 100), target)
    session.dispose()

    expect(target.releasePointerCapture).toHaveBeenNthCalledWith(1, 1)
    expect(target.releasePointerCapture).toHaveBeenNthCalledWith(2, 2)
    expect(onEnd).toHaveBeenCalledTimes(2)
    expect(onEnd).toHaveBeenLastCalledWith(
      expect.objectContaining({ cancelled: true }),
    )
  })

  it('ignores movement and completion from another pointer', () => {
    const onMove = vi.fn()
    const onEnd = vi.fn()
    const session = createPointerSession({ onStart: vi.fn(), onMove, onEnd })

    session.start(pointer(1, 100))
    session.move(pointer(2, 80, 10))
    session.end(pointer(2, 80, 10))

    expect(onMove).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
    expect(session.active).toBe(true)
  })

  it('rejects a second pointer while one is active', () => {
    const session = createPointerSession({
      onStart: vi.fn(),
      onMove: vi.fn(),
      onEnd: vi.fn(),
    })

    expect(session.start(pointer(1, 100))).toBe(true)
    expect(session.start(pointer(2, 100))).toBe(false)
  })

  it('can defer capture until gesture ownership is decided', () => {
    const target = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
    }
    const session = createPointerSession({
      onStart: vi.fn(),
      onMove: vi.fn(),
      onEnd: vi.fn(),
    })

    session.start(pointer(7, 100))
    expect(target.setPointerCapture).not.toHaveBeenCalled()
    session.capture(target)
    expect(target.setPointerCapture).toHaveBeenCalledWith(7)
    session.cancel()
    expect(target.releasePointerCapture).toHaveBeenCalledWith(7)
  })

  it('reports normalized displacement and velocity', () => {
    const onMove = vi.fn()
    const session = createPointerSession({
      onStart: vi.fn(),
      onMove,
      onEnd: vi.fn(),
    })

    session.start(pointer(1, 200, 0))
    session.move(pointer(1, 180, 10))
    session.move(pointer(1, 150, 20))

    expect(onMove).toHaveBeenLastCalledWith({
      deltaY: -50,
      positionY: 150,
      velocityY: -2.5,
    })
  })
})
