'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function LiveSheet() {
  const [open, setOpen] = useState(false)
  const [activeSnapPoint, setActiveSnapPoint] = useState('compact')

  return (
    <div className="docs-demo-stage" aria-label="Interactive sheet preview">
      <div className="docs-trajectory" aria-hidden="true">
        <span>expanded · 82%</span>
        <span>compact · 36%</span>
      </div>
      <Sheet.Root
        open={open}
        onOpenChange={setOpen}
        snapPoints={[
          { id: 'compact', value: '36%' },
          { id: 'expanded', value: '82%' },
        ]}
        activeSnapPoint={activeSnapPoint}
        onSnapPointChange={setActiveSnapPoint}
      >
        <Sheet.Trigger className="docs-demo-trigger">
          Open the live sheet
        </Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="docs-demo-sheet">
              <Sheet.Handle />
              <Sheet.Title>Try the real package</Sheet.Title>
              <Sheet.Description>
                Drag the handle or use the named destination controls. Escape
                closes the sheet and restores focus.
              </Sheet.Description>
              <p className="docs-demo-state" aria-live="polite">
                Current destination: {activeSnapPoint}
              </p>
              <div className="docs-demo-actions">
                <button
                  type="button"
                  aria-pressed={activeSnapPoint === 'compact'}
                  onClick={() => setActiveSnapPoint('compact')}
                >
                  Compact sheet
                </button>
                <button
                  type="button"
                  aria-pressed={activeSnapPoint === 'expanded'}
                  onClick={() => setActiveSnapPoint('expanded')}
                >
                  Expand sheet
                </button>
                <Sheet.Close>Close</Sheet.Close>
              </div>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  )
}
