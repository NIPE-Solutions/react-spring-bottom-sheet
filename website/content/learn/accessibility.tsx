import Link from 'next/link'

export function AccessibilityGuide() {
  return (
    <>
      <section id="accessible-name">
        <h2>Name every sheet</h2>
        <p>
          Put <code>Sheet.Title</code> and, when useful,
          <code> Sheet.Description</code> inside the content. Generated IDs
          connect them to the dialog automatically. An <code>aria-label</code>{' '}
          is available when a visible title would duplicate the surrounding
          interface.
        </p>
        <p>
          Modal sheets move focus inside on open, contain Tab navigation, close
          with Escape when dismissible, and restore focus when close state is
          entered. The visual exit then finishes independently.
        </p>
      </section>
      <section id="modal-and-non-modal">
        <h2>Modal and non-modal</h2>
        <p>
          Keep the default modal behavior for focused tasks. Set
          <code> modal={'{false}'}</code> only when the sheet and surrounding
          page must remain available together. A non-modal sheet does not
          isolate the page or contain focus.
        </p>
        <p>
          Use <code>dismissible={'{false}'}</code> sparingly for decisions that
          require an explicit outcome, and always render clearly named choices.
        </p>
        <p>
          <Link href="/examples/non-modal/">Compare non-modal behavior</Link> or{' '}
          <Link href="/examples/confirmation/">
            review explicit confirmation
          </Link>
          .
        </p>
      </section>
    </>
  )
}
