import { calculateVelocity } from './velocity.js'
import type { PositionSample } from './velocity.js'

export interface PointerSample {
  pointerId: number
  clientY: number
  timeStamp: number
}

export interface PointerCaptureTarget {
  setPointerCapture?(pointerId: number): void
  releasePointerCapture?(pointerId: number): void
  hasPointerCapture?(pointerId: number): boolean
}

export interface PointerMovement {
  deltaY: number
  positionY: number
  velocityY: number
}

export interface PointerCompletion extends PointerMovement {
  cancelled: boolean
}

export interface PointerSessionOptions {
  onStart(positionY: number): void
  onMove(movement: PointerMovement): void
  onEnd(completion: PointerCompletion): void
}

export interface PointerSession {
  readonly active: boolean
  start(pointer: PointerSample, target?: PointerCaptureTarget): boolean
  move(pointer: PointerSample): void
  end(pointer: PointerSample): void
  cancel(): void
  dispose(): void
}

export function createPointerSession(
  options: PointerSessionOptions,
): PointerSession {
  let pointerId: number | null = null
  let startY = 0
  let currentY = 0
  let captureTarget: PointerCaptureTarget | undefined
  let samples: PositionSample[] = []

  const movement = (): PointerMovement => ({
    deltaY: currentY - startY,
    positionY: currentY,
    velocityY: calculateVelocity(samples),
  })

  const cleanup = (cancelled: boolean) => {
    if (pointerId === null) return

    const completedPointerId = pointerId
    const completion = { ...movement(), cancelled }
    pointerId = null

    if (
      captureTarget?.releasePointerCapture &&
      (!captureTarget.hasPointerCapture ||
        captureTarget.hasPointerCapture(completedPointerId))
    ) {
      captureTarget.releasePointerCapture(completedPointerId)
    }

    captureTarget = undefined
    samples = []
    options.onEnd(completion)
  }

  return {
    get active() {
      return pointerId !== null
    },
    start(pointer, target) {
      if (pointerId !== null) return false
      pointerId = pointer.pointerId
      startY = pointer.clientY
      currentY = pointer.clientY
      captureTarget = target
      samples = [{ position: pointer.clientY, time: pointer.timeStamp }]
      target?.setPointerCapture?.(pointer.pointerId)
      options.onStart(pointer.clientY)
      return true
    },
    move(pointer) {
      if (pointer.pointerId !== pointerId) return
      currentY = pointer.clientY
      samples.push({ position: pointer.clientY, time: pointer.timeStamp })
      options.onMove(movement())
    },
    end(pointer) {
      if (pointer.pointerId !== pointerId) return
      currentY = pointer.clientY
      samples.push({ position: pointer.clientY, time: pointer.timeStamp })
      cleanup(false)
    },
    cancel() {
      cleanup(true)
    },
    dispose() {
      cleanup(true)
    },
  }
}
