'use client'

import { Sheet } from '@library'

export function ScrollingSheet() {
  return (
    <Sheet.Root snapPoints={[{ id: 'expanded', value: '82%' }]}>
      <Sheet.Trigger className="docs-recipe-trigger">
        Open scrolling sheet
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content className="docs-recipe-sheet">
            <Sheet.Handle />
            <Sheet.Title>Search results</Sheet.Title>
            <Sheet.Description>
              Scrollable content keeps gestures while it can move.
            </Sheet.Description>
            <div
              className="docs-recipe-scroll"
              role="region"
              aria-label="Scrollable results"
              tabIndex={0}
            >
              {Array.from({ length: 18 }, (_, index) => (
                <p key={index}>Result {index + 1}</p>
              ))}
              <button type="button">Load more results</button>
            </div>
            <Sheet.Close>Close results</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
