import Link from 'next/link'

export function TroubleshootingGuide() {
  return (
    <>
      <section id="missing-layout">
        <h2>The sheet has no layout</h2>
        <p>
          Import <code>styles.css</code> or <code>core.css</code> once from the
          application entry point. Core CSS owns positioning and pointer
          behavior; it is required even when every visual rule is replaced.
        </p>
      </section>
      <section id="missing-name">
        <h2>The sheet has no accessible name</h2>
        <p>
          Render <code>Sheet.Title</code> inside <code>Sheet.Content</code>, or
          add an <code>aria-label</code> to Content. A visual heading outside
          the sheet does not name the dialog across a portal boundary.
        </p>
      </section>
      <section id="controlled-state">
        <h2>Controlled state does not change</h2>
        <p>
          Update <code>open</code> in <code>onOpenChange</code> and
          <code> activeSnapPoint</code> in <code>onSnapPointChange</code>. Do
          not combine a controlled value with its corresponding default value.
        </p>
        <p>
          <Link href="/examples/controlled/">
            Compare the complete controlled pattern
          </Link>
        </p>
      </section>
    </>
  )
}
