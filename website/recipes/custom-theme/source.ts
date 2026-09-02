export const customThemeSource = `'use client'

import { Sheet } from '@library'
import './theme.css'

export function CustomThemeSheet() {
  return (
    <Sheet.Root snapPoints={[{ id: 'note', value: '58%' }]}>
      <Sheet.Trigger className="rsbs-example-field-note-trigger">Open field-note sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop className="rsbs-example-field-note-backdrop" />
        <Sheet.Viewport>
          <Sheet.Content className="rsbs-example-field-note">
            <Sheet.Handle className="rsbs-example-field-note-handle" />
            <Sheet.Title>Field notes</Sheet.Title>
            <Sheet.Description>A complete visual replacement.</Sheet.Description>
            <Sheet.Close className="rsbs-example-field-note-close">Archive note</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}

/* theme.css */
@layer rsbs.recipe {
  .rsbs-example-field-note-trigger,
  .rsbs-example-field-note-close { border: 2px solid #173fbd; border-radius: 0; background: #f8faff; color: #10255f; padding: .7rem 1rem; }
  .rsbs-example-field-note-backdrop { --rsbs-backdrop-color: #10255f; --rsbs-backdrop-opacity: .22; }
  .rsbs-example-field-note.rsbs-content { --rsbs-content-background: #f8faff; --rsbs-content-color: #10255f; --rsbs-content-border: 2px solid #173fbd; --rsbs-content-radius: 0; --rsbs-content-shadow: 0 -.5rem 0 #b9c9ff; background-color: #f8faff; color: #10255f; border-radius: 0; padding: 0 1.5rem 2rem; }
  .rsbs-example-field-note-handle { --rsbs-handle-color: #173fbd; --rsbs-handle-width: 5rem; --rsbs-handle-height: .2rem; }
}`
