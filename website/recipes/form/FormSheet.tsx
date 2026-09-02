'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function FormSheet() {
  const [open, setOpen] = useState(false)
  const [savedName, setSavedName] = useState('')
  return (
    <div className="docs-recipe-control">
      {savedName ? <p aria-live="polite">Saved for {savedName}</p> : null}
      <button type="button" onClick={() => setOpen(true)}>
        Open profile form
      </button>
      <Sheet.Root open={open} onOpenChange={setOpen}>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="docs-recipe-sheet">
              <Sheet.Handle />
              <Sheet.Title>Edit profile</Sheet.Title>
              <Sheet.Description>
                Changes are saved only when you submit.
              </Sheet.Description>
              <form
                className="docs-recipe-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  const data = new FormData(event.currentTarget)
                  setSavedName(String(data.get('displayName') ?? ''))
                  setOpen(false)
                }}
              >
                <label>
                  Display name
                  <input name="displayName" autoComplete="name" required />
                </label>
                <div className="docs-recipe-actions">
                  <button type="submit">Save profile</button>
                  <Sheet.Close>Cancel</Sheet.Close>
                </div>
              </form>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
