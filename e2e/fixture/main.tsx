import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Sheet } from '../../src/index.js'
import './styles.css'

function Fixture() {
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
      <Sheet.Trigger>Open sheet</Sheet.Trigger>
      <Sheet.Viewport>
        <Sheet.Content aria-label="Interaction fixture">
          <Sheet.Handle>Drag sheet</Sheet.Handle>
          <Sheet.Close>Dismiss sheet</Sheet.Close>
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
)
