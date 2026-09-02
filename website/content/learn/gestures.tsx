import Link from 'next/link'

export function GesturesGuide() {
  return (
    <>
      <section id="ownership">
        <h2>Ownership</h2>
        <p>
          Dragging the handle always moves the sheet. Inside scrollable content,
          the descendant keeps the gesture while it can scroll in that
          direction. At its boundary, the sheet can take ownership of the
          remaining movement.
        </p>
        <ul>
          <li>Do not prevent pointer events on the handle or content.</li>
          <li>Give long scroll regions a bounded height and visible focus.</li>
          <li>
            Keep primary actions reachable without relying on a drag gesture.
          </li>
        </ul>
        <p>
          <Link href="/examples/scrolling/">Exercise nested scrolling</Link>
        </p>
      </section>
      <section id="interruptions">
        <h2>Interruptions</h2>
        <p>
          Pointer cancellation, window blur, multi-touch, unmounting, and a new
          gesture share one cleanup path. The sheet settles from the last valid
          position instead of leaving capture or global listeners behind.
        </p>
      </section>
    </>
  )
}
