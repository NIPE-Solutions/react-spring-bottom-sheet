const DEFAULT_RESISTANCE = 0.35

export interface DragRange {
  min: number
  max: number
}

export function applyDragResistance(
  position: number,
  range: DragRange,
  resistance = DEFAULT_RESISTANCE,
): number {
  if (range.min > range.max) {
    throw new Error('drag range minimum cannot exceed maximum')
  }
  if (position < range.min) {
    return range.min + (position - range.min) * resistance
  }
  if (position > range.max) {
    return range.max + (position - range.max) * resistance
  }
  return position
}
