'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function ControlledSheet() {
  const [open, setOpen] = useState(false)

  return (
    <div className="docs-recipe-control">
      <p aria-live="polite">State: {open ? 'open' : 'closed'}</p>
      <button type="button" onClick={() => setOpen(true)}>
        Open controlled sheet
      </button>
      <Sheet.Root open={open} onOpenChange={setOpen}>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="docs-recipe-sheet">
              <Sheet.Handle />
              <Sheet.Title>Controlled bottom sheet</Sheet.Title>
              <Sheet.Description>
                Application state is the source of truth for this sheet.
              </Sheet.Description>
              <Sheet.Close>Close controlled sheet</Sheet.Close>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
