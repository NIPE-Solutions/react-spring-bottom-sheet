import type { DeviceSelection } from './device-config'

type DeviceControlsProps = Readonly<{
  selection: DeviceSelection
  onChange(selection: DeviceSelection): void
}>

export function DeviceControls({ selection, onChange }: DeviceControlsProps) {
  return (
    <div className="docs-device-controls">
      <fieldset>
        <legend>Device</legend>
        <div>
          {(['phone', 'tablet'] as const).map((device) => (
            <button
              type="button"
              aria-pressed={selection.device === device}
              key={device}
              onClick={() => onChange({ ...selection, device })}
            >
              {device === 'phone' ? 'Phone' : 'Tablet'}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Orientation</legend>
        <div>
          {(['portrait', 'landscape'] as const).map((orientation) => (
            <button
              type="button"
              aria-pressed={selection.orientation === orientation}
              key={orientation}
              onClick={() => onChange({ ...selection, orientation })}
            >
              {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
