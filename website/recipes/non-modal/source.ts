export const nonModalSource = `'use client'

import { Sheet } from '@library'

export function NonModalSheet() {
  return (
    <Sheet.Root modal={false}>
      <Sheet.Trigger>Open filters</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Persistent filters</Sheet.Title>
            <Sheet.Description>The page remains available while filters are open.</Sheet.Description>
            <Sheet.Close>Close filters</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`
