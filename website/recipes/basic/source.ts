export const basicSource = `'use client'

import { Sheet } from '@library'

export function BasicSheet() {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Open basic sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Basic bottom sheet</Sheet.Title>
            <Sheet.Description>
              A minimal sheet with local open state and content-sized layout.
            </Sheet.Description>
            <Sheet.Close>Close sheet</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`
