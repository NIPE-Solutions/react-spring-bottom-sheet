import { calcGeneratorDuration, spring } from 'motion'
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

const motionDriver: AnimationDriver = (from, to, options) => {
  const generator = spring({
    keyframes: [from, to],
    velocity: options.velocity,
    stiffness: options.stiffness,
    damping: options.damping,
  })
  // Use the same duration sampling and millisecond rounding as Motion's
  // JSAnimation, so the existing spring trajectory and settling time survive.
  const duration = calcGeneratorDuration(generator)
  let startTime = performance.now()
  let stopped = false
  let frameId: number

  const update = (timestamp: number) => {
    if (stopped) return
    // A browser's frame timestamp can precede performance.now() at startup.
    startTime = Math.min(startTime, timestamp)
    const elapsed = Math.round(timestamp - startTime)
    const done = elapsed >= duration
    options.onUpdate(done ? to : generator.next(elapsed).value)
    if (stopped) return
    if (done) {
      // Motion's animate() reports completion through a promise. Preserve
      // that ordering, but suppress completion if effect cleanup intervenes.
      queueMicrotask(() => {
        if (stopped) return
        stopped = true
        options.onComplete()
      })
    } else {
      frameId = requestAnimationFrame(update)
    }
  }

  frameId = requestAnimationFrame(update)
  return {
    stop() {
      stopped = true
      cancelAnimationFrame(frameId)
    },
  }
}

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
