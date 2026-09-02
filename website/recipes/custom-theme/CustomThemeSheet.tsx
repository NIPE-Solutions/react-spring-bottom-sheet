'use client'

import { Sheet } from '@library'
import './theme.css'

export function CustomThemeSheet() {
  return (
    <Sheet.Root snapPoints={[{ id: 'note', value: '58%' }]}>
      <Sheet.Trigger className="rsbs-example-field-note-trigger">
        Open field-note sheet
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop className="rsbs-example-field-note-backdrop" />
        <Sheet.Viewport>
          <Sheet.Content className="rsbs-example-field-note">
            <Sheet.Handle className="rsbs-example-field-note-handle" />
            <p className="rsbs-example-field-note-index">Field note 07</p>
            <Sheet.Title>Field notes</Sheet.Title>
            <Sheet.Description>
              A complete visual replacement built on the stable mechanical
              layer.
            </Sheet.Description>
            <div className="rsbs-example-field-note-rule" aria-hidden="true" />
            <p>Use ordinary selectors and keep application tokens local.</p>
            <Sheet.Close className="rsbs-example-field-note-close">
              Archive note
            </Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
