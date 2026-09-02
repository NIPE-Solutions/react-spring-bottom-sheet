import { useState } from 'react'
import { BottomSheet, Sheet } from '../../src/index.js'

export function ReadmeExample() {
  return (
    <Sheet.Root snapPoints={[{ id: 'content', value: 'content' }]}>
      <Sheet.Trigger>Open account actions</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Account actions</Sheet.Title>
            <Sheet.Description>
              Choose what you want to do next.
            </Sheet.Description>
            <Sheet.Close>Done</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}

export function ControlledExample() {
  const [open, setOpen] = useState(false)
  const [snapPoint, setSnapPoint] = useState('compact')

  return (
    <BottomSheet
      open={open}
      onOpenChange={setOpen}
      title="Details"
      snapPoints={[
        { id: 'compact', value: '35%' },
        { id: 'expanded', value: '82%' },
      ]}
      activeSnapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
    >
      Controlled content
    </BottomSheet>
  )
}
