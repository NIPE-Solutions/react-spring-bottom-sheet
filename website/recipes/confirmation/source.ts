export const confirmationSource = `'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function ConfirmationSheet({ deleteWorkspace }: { deleteWorkspace: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete workspace</button>
      <Sheet.Root open={open} onOpenChange={setOpen} dismissible={false}>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content>
              <Sheet.Handle />
              <Sheet.Title>Delete this workspace?</Sheet.Title>
              <Sheet.Description>This permanently removes its projects and settings.</Sheet.Description>
              <button onClick={() => setOpen(false)}>Keep workspace</button>
              <button onClick={() => { deleteWorkspace(); setOpen(false) }}>Confirm deletion</button>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  )
}`
