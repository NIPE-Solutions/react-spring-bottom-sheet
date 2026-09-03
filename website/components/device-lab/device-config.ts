export type Orientation = 'portrait' | 'landscape'

export type DeviceSelection = Readonly<{
  device: Device
  orientation: Orientation
}>

export type DevicePreset = Readonly<{
  width: number
  height: number
  label: string
  radius: string
}>

export const DEFAULT_DEVICE_SELECTION: DeviceSelection = Object.freeze({
  device: 'phone',
  orientation: 'portrait',
})

const DEVICE_CONFIGURATIONS = Object.freeze({
  phone: Object.freeze({
    label: 'Phone',
    radius: '1.75rem',
    presets: Object.freeze({
      portrait: Object.freeze({ width: 390, height: 780 }),
      landscape: Object.freeze({ width: 780, height: 390 }),
    }),
  }),
  tablet: Object.freeze({
    label: 'Tablet',
    radius: '1.15rem',
    presets: Object.freeze({
      portrait: Object.freeze({ width: 820, height: 1080 }),
      landscape: Object.freeze({ width: 1080, height: 820 }),
    }),
  }),
})

export type Device = keyof typeof DEVICE_CONFIGURATIONS

export const DEVICE_OPTIONS = Object.freeze(
  Object.keys(DEVICE_CONFIGURATIONS) as Device[],
)

export function getDevicePreset(selection: DeviceSelection): DevicePreset {
  const configuration = DEVICE_CONFIGURATIONS[selection.device]

  return {
    ...configuration.presets[selection.orientation],
    label: configuration.label,
    radius: configuration.radius,
  }
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
