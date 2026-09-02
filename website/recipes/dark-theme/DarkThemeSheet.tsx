'use client'

import { Sheet } from '@library'
import './theme.css'

export function DarkThemeSheet() {
  return (
    <Sheet.Root snapPoints={[{ id: 'instrument', value: '62%' }]}>
      <Sheet.Trigger className="rsbs-example-night-trigger">
        Open night-instrument sheet
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop className="rsbs-example-night-backdrop" />
        <Sheet.Viewport>
          <Sheet.Content className="rsbs-example-night">
            <Sheet.Handle className="rsbs-example-night-handle" />
            <p className="rsbs-example-night-status">System · nominal</p>
            <Sheet.Title>Night instrument</Sheet.Title>
            <Sheet.Description>
              An explicit dark theme that stays consistent in either color
              scheme.
            </Sheet.Description>
            <dl className="rsbs-example-night-readout">
              <div className="rsbs-example-night-reading">
                <dt className="rsbs-example-night-label">Altitude</dt>
                <dd className="rsbs-example-night-value">2,104 m</dd>
              </div>
              <div className="rsbs-example-night-reading">
                <dt className="rsbs-example-night-label">Visibility</dt>
                <dd className="rsbs-example-night-value">18 km</dd>
              </div>
            </dl>
            <Sheet.Close className="rsbs-example-night-close">
              End reading
            </Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
