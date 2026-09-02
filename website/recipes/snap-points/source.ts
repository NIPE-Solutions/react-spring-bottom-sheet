export const snapPointSource = `'use client'

import { useState } from 'react'
import { Sheet } from '@library'

const snapPoints = [
  { id: 'compact', value: '35%' },
  { id: 'expanded', value: '82%' },
] as const

export function SnapPointSheet() {
  const [activeSnapPoint, setActiveSnapPoint] = useState('compact')

  return (
    <Sheet.Root
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      onSnapPointChange={setActiveSnapPoint}
    >
      <Sheet.Trigger>Open snap-point sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Named snap points</Sheet.Title>
            <Sheet.Description>
              Stable names keep layout choices readable in application state.
            </Sheet.Description>
            <p>Active snap point: {activeSnapPoint}</p>
            {snapPoints.map(({ id }) => (
              <button key={id} onClick={() => setActiveSnapPoint(id)}>
                {id}
              </button>
            ))}
            <Sheet.Close>Close snap-point sheet</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`
