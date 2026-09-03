export const customPortalSource = `'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function CustomPortalSheet() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <div className="sheet-boundary" ref={setContainer}>
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
}

/* The transform establishes the containing block for fixed sheet layers. */
.sheet-boundary {
  position: relative;
  height: 24rem;
  overflow: hidden;
  transform: translateZ(0);
}`
