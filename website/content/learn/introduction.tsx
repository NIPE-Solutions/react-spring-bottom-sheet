import Link from 'next/link'

export function IntroductionGuide() {
  return (
    <>
      <section id="dialog-behavior">
        <h2>A bottom sheet that behaves like a dialog</h2>
        <p>
          A sheet is useful only when its visual movement and interaction model
          agree. Version 5 connects naming, focus, dismissal, layout, gestures,
          and motion through one compound component contract.
        </p>
        <p>
          Start with <code>Sheet.Root</code>, render a title inside the content,
          and choose whether the surrounding page should be inert. The default
          modal behavior is the right choice for focused tasks.
        </p>
        <p>
          <Link href="/examples/basic/">Run the basic sheet recipe</Link>
        </p>
      </section>
      <section id="deliberate-boundaries">
        <h2>Deliberate boundaries</h2>
        <ul>
          <li>
            Application state controls open and snap destinations when needed.
          </li>
          <li>The animation engine stays behind the public component API.</li>
          <li>
            Mechanical CSS and the optional visual theme are separate entry
            points.
          </li>
          <li>
            Library selectors use the <code>rsbs</code> namespace.
          </li>
        </ul>
        <p>
          These boundaries let an application replace visuals or coordinate
          state without taking ownership of focus management and gesture
          cleanup.
        </p>
      </section>
    </>
  )
}
