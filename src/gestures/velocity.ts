export interface PositionSample {
  position: number
  time: number
}

export function calculateVelocity(
  samples: readonly PositionSample[],
  windowMilliseconds = 100,
): number {
  if (samples.length < 2) return 0
  const latest = samples[samples.length - 1]!
  const threshold = latest.time - windowMilliseconds
  const earliest = samples.find(({ time }) => time >= threshold) ?? samples[0]!
  const elapsed = latest.time - earliest.time
  return elapsed > 0 ? (latest.position - earliest.position) / elapsed : 0
}
