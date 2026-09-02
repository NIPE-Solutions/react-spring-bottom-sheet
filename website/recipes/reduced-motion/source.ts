export const reducedMotionSource = `'use client'

import { Sheet } from '@library'

export function ReducedMotionSheet() {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Open reduced-motion sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Motion preference</Sheet.Title>
            <Sheet.Description>The sheet follows prefers-reduced-motion automatically.</Sheet.Description>
            <Sheet.Close>Close sheet</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`
