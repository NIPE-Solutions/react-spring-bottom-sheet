export const contentHeightSource = `'use client'

import { useState } from 'react'
import { Sheet } from '@library'

export function ContentHeightSheet() {
  const [details, setDetails] = useState(1)
  return (
    <Sheet.Root snapPoints={[{ id: 'content', value: 'content' }]}>
      <Sheet.Trigger>Open content-height sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Content-sized details</Sheet.Title>
            <Sheet.Description>The sheet follows its content height.</Sheet.Description>
            {Array.from({ length: details }, (_, index) => <p key={index}>Detail {index + 1}</p>)}
            <button onClick={() => setDetails((count) => count + 1)}>Show another detail</button>
            <Sheet.Close>Done</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`
