import { useState } from 'react'
import { Sheet } from '../../src/index.js'

export function Fixture({ customTheme = false }: { customTheme?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <Sheet.Root
      open={open}
      onOpenChange={setOpen}
      snapPoints={[
        { id: 'expanded', value: 0.8 },
        { id: 'half', value: 0.5 },
      ]}
      defaultSnapPoint="half"
    >
      <Sheet.Trigger className={customTheme ? 'catalog-trigger' : undefined}>
        Open sheet
      </Sheet.Trigger>
      <Sheet.Backdrop
        className={customTheme ? 'catalog-backdrop' : undefined}
      />
      <Sheet.Viewport>
        <Sheet.Content
          aria-label="Interaction fixture"
          className={customTheme ? 'catalog-sheet' : undefined}
        >
          <Sheet.Handle className={customTheme ? 'catalog-handle' : undefined}>
            Drag sheet
          </Sheet.Handle>
          <Sheet.Close className={customTheme ? 'catalog-close' : undefined}>
            Dismiss sheet
          </Sheet.Close>
          <div className="scroll-region" data-testid="scroll-region">
            <div className="spacer-before" />
            <button>Scrollable action</button>
            <div className="spacer-after" />
          </div>
        </Sheet.Content>
      </Sheet.Viewport>
    </Sheet.Root>
  )
}
