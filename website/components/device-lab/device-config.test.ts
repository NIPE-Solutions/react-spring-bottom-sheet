import { describe, expect, test } from 'vitest'
import {
  DEFAULT_DEVICE_SELECTION,
  getDevicePreset,
  parseDeviceSelection,
  toDeviceSearchParams,
} from './device-config'

describe('device configuration', () => {
  test.each([
    ['phone portrait', { device: 'phone', orientation: 'portrait' }, 390, 780],
    [
      'phone landscape',
      { device: 'phone', orientation: 'landscape' },
      780,
      390,
    ],
    [
      'tablet portrait',
      { device: 'tablet', orientation: 'portrait' },
      820,
      1080,
    ],
    [
      'tablet landscape',
      { device: 'tablet', orientation: 'landscape' },
      1080,
      820,
    ],
  ] as const)('%s uses its exact dimensions', (_, selection, width, height) => {
    expect(getDevicePreset(selection)).toMatchObject({ width, height })
  })

  test.each([
    ['phone', { device: 'phone', orientation: 'portrait' }, 'Phone', '1.75rem'],
    [
      'tablet',
      { device: 'tablet', orientation: 'portrait' },
      'Tablet',
      '1.15rem',
    ],
  ] as const)(
    '%s exposes its display label and frame radius with the preset',
    (_, selection, label, radius) => {
      expect(getDevicePreset(selection)).toMatchObject({ label, radius })
    },
  )

  test('provides a phone portrait default', () => {
    expect(DEFAULT_DEVICE_SELECTION).toEqual({
      device: 'phone',
      orientation: 'portrait',
    })
  })

  test('parses valid query values', () => {
    expect(
      parseDeviceSelection(
        new URLSearchParams('device=tablet&orientation=landscape'),
      ),
    ).toEqual({ device: 'tablet', orientation: 'landscape' })
  })

  test('falls back to the default for invalid values', () => {
    expect(
      parseDeviceSelection(
        new URLSearchParams('device=watch&orientation=upside-down'),
      ),
    ).toEqual(DEFAULT_DEVICE_SELECTION)
  })

  test('serializes selections in stable key order', () => {
    expect(
      toDeviceSearchParams({
        device: 'tablet',
        orientation: 'landscape',
      }).toString(),
    ).toBe('device=tablet&orientation=landscape')
  })
})
