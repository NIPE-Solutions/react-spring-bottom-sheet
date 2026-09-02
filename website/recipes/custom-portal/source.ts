export const customPortalSource = `'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function CustomPortalSheet() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <div ref={setContainer}>
      <Sheet.Root>
        <Sheet.Trigger>Open contained sheet</Sheet.Trigger>
        <Sheet.Portal container={container}>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content>
              <Sheet.Handle />
              <Sheet.Title>Contained sheet</Sheet.Title>
              <Sheet.Description>This sheet is portalled into the application panel.</Sheet.Description>
              <Sheet.Close>Close contained sheet</Sheet.Close>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}`
