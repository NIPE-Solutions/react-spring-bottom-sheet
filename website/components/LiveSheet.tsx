'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function LiveSheet() {
  const [open, setOpen] = useState(false)
  return (
    <div className="docs-demo-stage">
      <div className="docs-trajectory" aria-hidden="true">
        <span>90%</span>
        <span>55%</span>
        <span>content</span>
      </div>
      <Sheet.Root
        open={open}
        onOpenChange={setOpen}
        snapPoints={[
          { id: 'content', value: 'content' },
          { id: 'full', value: '80%' },
        ]}
      >
        <Sheet.Trigger className="docs-demo-trigger">
          Open the live sheet
        </Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="docs-demo-sheet">
              <Sheet.Handle />
              <Sheet.Title>Built from the real package</Sheet.Title>
              <Sheet.Description>
                Drag the handle, press Escape, or move through the controls with
                a keyboard.
              </Sheet.Description>
              <div className="docs-demo-actions">
                <button type="button">Primary action</button>
                <Sheet.Close>Close</Sheet.Close>
              </div>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
