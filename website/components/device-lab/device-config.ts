export type Device = 'phone' | 'tablet'

export type Orientation = 'portrait' | 'landscape'

export type DeviceSelection = Readonly<{
  device: Device
  orientation: Orientation
}>

export type DevicePreset = Readonly<{
  width: number
  height: number
}>

export const DEFAULT_DEVICE_SELECTION: DeviceSelection = Object.freeze({
  device: 'phone',
  orientation: 'portrait',
})

const DEVICE_PRESETS: Readonly<
  Record<Device, Readonly<Record<Orientation, DevicePreset>>>
> = Object.freeze({
  phone: Object.freeze({
    portrait: Object.freeze({ width: 390, height: 780 }),
    landscape: Object.freeze({ width: 780, height: 390 }),
  }),
  tablet: Object.freeze({
    portrait: Object.freeze({ width: 768, height: 1024 }),
    landscape: Object.freeze({ width: 1024, height: 768 }),
  }),
})

export function getDevicePreset(selection: DeviceSelection): DevicePreset {
  return DEVICE_PRESETS[selection.device][selection.orientation]
}

export function parseDeviceSelection(
  searchParams: URLSearchParams,
): DeviceSelection {
  const device = searchParams.get('device')
  const orientation = searchParams.get('orientation')

  if (
    (device === 'phone' || device === 'tablet') &&
    (orientation === 'portrait' || orientation === 'landscape')
  ) {
    return { device, orientation }
  }

  return DEFAULT_DEVICE_SELECTION
}

export function toDeviceSearchParams(
  selection: DeviceSelection,
): URLSearchParams {
  return new URLSearchParams([
    ['device', selection.device],
    ['orientation', selection.orientation],
  ])
}
