import Link from 'next/link'
import { StylesReference } from '../reference/styles'

export function StylingGuide() {
  return (
    <>
      <section id="entry-points">
        <h2>Three styling paths</h2>
        <p>
          Most applications should import <code>styles.css</code> once. It
          combines the mechanical layer with a restrained, production-ready
          default theme.
        </p>
        <pre>
          <code>
            {"import '@nipe-solutions/react-spring-bottom-sheet/styles.css'"}
          </code>
        </pre>
        <p>
          For a complete visual replacement, import <code>core.css</code>{' '}
          instead. Import <code>theme.css</code> when you want the default
          visual rules, or <code>tokens.css</code> when you only need their
          starting values.
        </p>
        <StylesReference />
      </section>
      <section id="complete-replacement">
        <h2>Complete replacement</h2>
        <p>
          The library owns the <code>rsbs-*</code> namespace. Give application
          hooks their own clear prefix, then combine one with a stable library
          hook—for example <code>.checkout-sheet.rsbs-content</code>. The core
          selectors have deliberately low specificity, so ordinary selectors win
          without <code>!important</code>.
        </p>
        <pre>
          <code>{`import '@nipe-solutions/react-spring-bottom-sheet/core.css'
import './sheet-theme.css'

/* sheet-theme.css */
.checkout-sheet.rsbs-content {
  background: var(--checkout-surface);
  color: var(--checkout-text);
}`}</code>
        </pre>
        <p>
          Keep page-layout selectors out of sheet themes. The documentation site
          uses <code>docs-*</code>; its examples use <code>rsbs-example-*</code>
          . That boundary prevents either stylesheet from accidentally reaching
          into the other.
        </p>
        <p>
          Compare the square-edged{' '}
          <Link href="/examples/custom-theme/">field-note theme</Link> with the
          explicit{' '}
          <Link href="/examples/dark-theme/">dark instrument theme</Link>. Both
          replace the complete visual layer while retaining the same component
          behavior.
        </p>
      </section>
    </>
  )
}
