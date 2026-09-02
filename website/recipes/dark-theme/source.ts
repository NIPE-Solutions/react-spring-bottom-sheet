export const darkThemeSource = `'use client'

import { Sheet } from '@library'
import './theme.css'

export function DarkThemeSheet() {
  return (
    <Sheet.Root snapPoints={[{ id: 'instrument', value: '62%' }]}>
      <Sheet.Trigger className="rsbs-example-night-trigger">Open night-instrument sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop className="rsbs-example-night-backdrop" />
        <Sheet.Viewport>
          <Sheet.Content className="rsbs-example-night">
            <Sheet.Handle className="rsbs-example-night-handle" />
            <Sheet.Title>Night instrument</Sheet.Title>
            <Sheet.Description>An explicit dark theme.</Sheet.Description>
            <Sheet.Close className="rsbs-example-night-close">End reading</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}

/* theme.css */
@layer rsbs.recipe {
  .rsbs-example-night-backdrop { --rsbs-backdrop-color: #020711; --rsbs-backdrop-opacity: .76; }
  .rsbs-example-night.rsbs-content { --rsbs-content-background: #0e1726; --rsbs-content-color: #e8f1f7; --rsbs-content-border: 1px solid #40566f; --rsbs-content-radius: 1.75rem; --rsbs-content-shadow: 0 -1.5rem 4rem rgb(0 0 0 / 48%); background-color: #0e1726; color: #e8f1f7; border-radius: 1.75rem 1.75rem 0 0; padding: 0 1.5rem 2rem; }
  .rsbs-example-night-handle { --rsbs-handle-color: #8bc6d1; --rsbs-handle-width: 3.5rem; }
}`
