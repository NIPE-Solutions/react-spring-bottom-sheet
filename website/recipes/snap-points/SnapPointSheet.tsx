'use client'

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
      <Sheet.Trigger className="docs-recipe-trigger">
        Open snap-point sheet
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content className="docs-recipe-sheet">
            <Sheet.Handle />
            <Sheet.Title>Named snap points</Sheet.Title>
            <Sheet.Description>
              Stable names keep layout choices readable in application state.
            </Sheet.Description>
            <p aria-live="polite">Active snap point: {activeSnapPoint}</p>
            <div className="docs-recipe-actions">
              {snapPoints.map(({ id }) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={activeSnapPoint === id}
                  onClick={() => setActiveSnapPoint(id)}
                >
                  {id === 'compact' ? 'Compact' : 'Expanded'}
                </button>
              ))}
              <Sheet.Close>Close snap-point sheet</Sheet.Close>
            </div>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
