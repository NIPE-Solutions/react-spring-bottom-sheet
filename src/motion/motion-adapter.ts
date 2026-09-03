import { animate } from 'motion'
import type { MotionAdapter } from './types.js'

interface AnimationOptions {
  type: 'spring'
  velocity: number
  stiffness: number
  damping: number
  onUpdate(value: number): void
  onComplete(): void
}

interface AnimationControls {
  stop(): void
}

type AnimationDriver = (
  from: number,
  to: number,
  options: AnimationOptions,
) => AnimationControls

const motionDriver = animate as AnimationDriver

export function createMotionAdapter(
  driver: AnimationDriver = motionDriver,
): MotionAdapter {
  return {
    start(request) {
      if (request.reducedMotion) {
        request.onUpdate(request.to)
        request.onComplete()
        return { stop() {} }
      }

      const controls = driver(request.from, request.to, {
        type: 'spring',
        velocity: request.velocity * 1000,
        stiffness: 380,
        damping: 38,
        onUpdate: request.onUpdate,
        onComplete: request.onComplete,
      })

      return { stop: () => controls.stop() }
    },
  }
}

export const motionAdapter = createMotionAdapter()
