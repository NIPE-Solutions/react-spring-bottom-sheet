export const scrollingSource = `'use client'

import { Sheet } from '@library'

const results = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  label: \`Result \${index + 1}\`,
}))

export function ScrollingSheet() {
  return (
    <Sheet.Root snapPoints={[{ id: 'expanded', value: '82%' }]}>
      <Sheet.Trigger>Open scrolling sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Search results</Sheet.Title>
            <Sheet.Description>Scrollable content keeps gestures while it can move.</Sheet.Description>
            <div role="region" aria-label="Scrollable results" tabIndex={0} style={{ maxHeight: 320, overflow: 'auto' }}>
              {results.map((result) => <p key={result.id}>{result.label}</p>)}
              <button type="button">Load more results</button>
            </div>
            <Sheet.Close>Close results</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`
