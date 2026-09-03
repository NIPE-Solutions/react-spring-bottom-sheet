export interface MotionRequest {
  from: number
  to: number
  velocity: number
  reducedMotion: boolean
  onUpdate(value: number): void
  onComplete(): void
}

export interface MotionHandle {
  stop(): void
}

export interface MotionAdapter {
  start(request: MotionRequest): MotionHandle
}
