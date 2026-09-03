import Link from 'next/link'

export function AnatomyGuide() {
  return (
    <>
      <section id="compound-components">
        <h2>Compound components</h2>
        <p>
          <code>Sheet.Root</code> owns behavior. Trigger and Close request state
          changes; Portal chooses the DOM boundary; Backdrop, Viewport, Content,
          Handle, Title, and Description describe the rendered interface.
        </p>
        <pre>
          <code>{`<Sheet.Root>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.Backdrop />
    <Sheet.Viewport>
      <Sheet.Content>
        <Sheet.Handle />
        <Sheet.Title>Filters</Sheet.Title>
        <Sheet.Description>Narrow the results.</Sheet.Description>
        <Sheet.Close>Done</Sheet.Close>
      </Sheet.Content>
    </Sheet.Viewport>
  </Sheet.Portal>
</Sheet.Root>`}</code>
        </pre>
      </section>
      <section id="convenience-composition">
        <h2>Convenience composition</h2>
        <p>
          Use <code>BottomSheet</code> when the standard anatomy is sufficient.
          It composes the same primitives rather than maintaining separate
          behavior. Reach for explicit primitives when you need a custom portal
          or omit a backdrop.
        </p>
        <p>
          <Link href="/examples/custom-portal/">
            See the custom portal boundary
          </Link>
        </p>
      </section>
    </>
  )
}
