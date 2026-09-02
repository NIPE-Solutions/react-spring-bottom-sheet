'use client'

import { Sheet } from '@library'

export function ReducedMotionSheet() {
  return (
    <Sheet.Root>
      <Sheet.Trigger className="docs-recipe-trigger">
        Open reduced-motion sheet
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content className="docs-recipe-sheet">
            <Sheet.Handle />
            <Sheet.Title>Motion preference</Sheet.Title>
            <Sheet.Description>
              The same component follows the operating system motion preference
              automatically.
            </Sheet.Description>
            <Sheet.Close>Close sheet</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
