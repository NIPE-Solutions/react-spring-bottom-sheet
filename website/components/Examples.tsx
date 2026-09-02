'use client'

import { useRef, useState } from 'react'
import { Sheet } from '@library'

const snaps = [
  { id: 'compact', value: '35%' },
  { id: 'expanded', value: '82%' },
] as const

export function Examples() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(true)
  const [active, setActive] = useState('compact')
  const portal = useRef<HTMLDivElement>(null)
  return (
    <section
      className="example-workbench"
      aria-label="Interactive configuration"
    >
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={modal}
            onChange={(event) => setModal(event.target.checked)}
          />{' '}
          Modal behavior
        </label>
        <label>
          Snap point
          <select
            value={active}
            onChange={(event) => setActive(event.target.value)}
          >
            <option value="compact">Compact</option>
            <option value="expanded">Expanded</option>
          </select>
        </label>
        <button type="button" onClick={() => setOpen(true)}>
          Open example
        </button>
      </div>
      <div ref={portal} className="portal-target">
        <p>Custom portal target</p>
      </div>
      <Sheet.Root
        open={open}
        onOpenChange={setOpen}
        modal={modal}
        snapPoints={snaps}
        activeSnapPoint={active}
        onSnapPointChange={setActive}
      >
        <Sheet.Portal container={portal.current}>
          <Sheet.Backdrop />
          <Sheet.Viewport>
            <Sheet.Content className="example-sheet">
              <Sheet.Handle />
              <Sheet.Title>
                {modal ? 'Modal sheet' : 'Non-modal sheet'}
              </Sheet.Title>
              <Sheet.Description>
                Controlled state and named snap points in a custom portal.
              </Sheet.Description>
              <div className="scroll-sample" tabIndex={0}>
                {Array.from({ length: 8 }, (_, index) => (
                  <p key={index}>Scrollable item {index + 1}</p>
                ))}
              </div>
              <Sheet.Close>Close example</Sheet.Close>
            </Sheet.Content>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </section>
  )
}
