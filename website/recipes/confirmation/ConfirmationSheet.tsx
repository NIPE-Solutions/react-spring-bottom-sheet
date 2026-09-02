'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function ConfirmationSheet() {
  const [open, setOpen] = useState(false)
  return (
    <div className="docs-recipe-control">
      <button type="button" onClick={() => setOpen(true)}>
        Delete workspace
      </button>
      <Sheet.Root open={open} onOpenChange={setOpen} dismissible={false}>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="docs-recipe-sheet">
              <Sheet.Handle />
              <Sheet.Title>Delete this workspace?</Sheet.Title>
              <Sheet.Description>
                This action permanently removes its projects and settings.
              </Sheet.Description>
              <div className="docs-recipe-actions">
                <button type="button" onClick={() => setOpen(false)}>
                  Keep workspace
                </button>
                <button type="button" onClick={() => setOpen(false)}>
                  Confirm deletion
                </button>
              </div>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
