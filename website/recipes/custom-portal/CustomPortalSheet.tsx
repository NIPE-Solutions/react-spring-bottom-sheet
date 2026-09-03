'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function CustomPortalSheet() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <div className="docs-custom-portal-target" ref={setContainer}>
      <p>Application panel boundary</p>
      <Sheet.Root>
        <Sheet.Trigger className="docs-recipe-trigger">
          Open contained sheet
        </Sheet.Trigger>
        <Sheet.Portal container={container}>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="docs-recipe-sheet">
              <Sheet.Handle />
              <Sheet.Title>Contained sheet</Sheet.Title>
              <Sheet.Description>
                This sheet is portalled into the application panel.
              </Sheet.Description>
              <Sheet.Close>Close contained sheet</Sheet.Close>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
