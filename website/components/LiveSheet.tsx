'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function LiveSheet() {
  const [open, setOpen] = useState(false)
  const [activeSnapPoint, setActiveSnapPoint] = useState('compact')
  const [phoneScreen, setPhoneScreen] = useState<HTMLDivElement | null>(null)

  return (
    <div className="docs-demo-stage" aria-label="Interactive sheet preview">
      <div className="docs-phone" aria-label="Phone preview">
        <div className="docs-phone-screen" ref={setPhoneScreen}>
          <div className="docs-phone-status" aria-hidden="true">
            <span>9:41</span>
            <span>● ● ●</span>
          </div>
          <div className="docs-phone-app">
            <p className="docs-phone-place">Vienna · Wednesday</p>
            <h2>Your afternoon</h2>
            <ol className="docs-phone-route">
              <li>
                <time>14:30</time>
                <span>Secession</span>
              </li>
              <li>
                <time>16:00</time>
                <span>Naschmarkt</span>
              </li>
              <li>
                <time>18:15</time>
                <span>Karlsplatz</span>
              </li>
            </ol>
            <Sheet.Root
              open={open}
              onOpenChange={setOpen}
              snapPoints={[
                { id: 'compact', value: '48%' },
                { id: 'expanded', value: '82%' },
              ]}
              activeSnapPoint={activeSnapPoint}
              onSnapPointChange={setActiveSnapPoint}
            >
              <Sheet.Trigger className="docs-demo-trigger">
                Open the live sheet
              </Sheet.Trigger>
              <Sheet.Portal container={phoneScreen}>
                <Sheet.Backdrop className="docs-phone-backdrop" />
                <Sheet.Viewport>
                  <Sheet.Content className="docs-demo-sheet">
                    <Sheet.Handle />
                    <Sheet.Title>Try the real package</Sheet.Title>
                    <Sheet.Description>
                      Drag the handle or choose a named destination.
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
        </div>
      </div>
    </div>
  )
}
