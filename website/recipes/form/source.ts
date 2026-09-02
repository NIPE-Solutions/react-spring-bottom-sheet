export const formSource = `'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function FormSheet() {
  const [open, setOpen] = useState(false)
  const [savedName, setSavedName] = useState('')
  return (
    <>
      {savedName ? <p>Saved for {savedName}</p> : null}
      <button onClick={() => setOpen(true)}>Open profile form</button>
      <Sheet.Root open={open} onOpenChange={setOpen}>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content>
              <Sheet.Handle />
              <Sheet.Title>Edit profile</Sheet.Title>
              <Sheet.Description>Changes are saved only when you submit.</Sheet.Description>
              <form onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                setSavedName(String(data.get('displayName') ?? ''))
                setOpen(false)
              }}>
                <label>Display name<input name="displayName" autoComplete="name" required /></label>
                <button type="submit">Save profile</button>
                <Sheet.Close>Cancel</Sheet.Close>
              </form>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  )
}`
