export type OpenChangeReason =
  'trigger' | 'close' | 'escape' | 'backdrop' | 'drag' | 'imperative'

export interface OpenChangeDetails {
  reason: OpenChangeReason
}

export type SnapPointValue = number | `${number}px` | `${number}%` | 'content'

export interface SnapPoint {
  id: string
  value: SnapPointValue
}
