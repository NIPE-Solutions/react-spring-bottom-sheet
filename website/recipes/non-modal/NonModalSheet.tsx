'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function NonModalSheet() {
  const [updates, setUpdates] = useState(0)
  return (
    <div className="docs-recipe-control">
      <p aria-live="polite">Page updates: {updates}</p>
      <button type="button" onClick={() => setUpdates((count) => count + 1)}>
        Update page counter
      </button>
      <Sheet.Root modal={false}>
        <Sheet.Trigger className="docs-recipe-trigger">
          Open non-modal sheet
        </Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Viewport>
            <Sheet.Content className="docs-recipe-sheet">
              <Sheet.Handle />
              <Sheet.Title>Persistent filters</Sheet.Title>
              <Sheet.Description>
                The page remains available while these filters are open.
              </Sheet.Description>
              <Sheet.Close>Close filters</Sheet.Close>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
