import Link from 'next/link'
import type { ReactNode } from 'react'

type MigrationPageContentProps = {
  installCommand?: ReactNode
  beforeExample?: ReactNode
  afterExample?: ReactNode
}

const mappings: readonly [string, ReactNode][] = [
  [
    'open',
    <>
      Keep <code>open</code> on <code>Sheet.Root</code> or{' '}
      <code>BottomSheet</code>.
    </>,
  ],
  [
    'blocking',
    <>
      Replace with <code>modal</code>.
    </>,
  ],
  [
    'onDismiss',
    <>
      Use <code>onOpenChange</code> and update controlled state when it receives{' '}
      <code>false</code>.
    </>,
  ],
  [
    'snapPoints',
    <>
      Provide named <code>{'{ id, value }'}</code> snap points.
    </>,
  ],
  [
    'defaultSnap',
    <>
      Use <code>defaultSnapPoint</code> with a snap-point id.
    </>,
  ],
  [
    'header',
    <>
      Compose header content before the scroll region inside{' '}
      <code>Sheet.Content</code>.
    </>,
  ],
  [
    'footer',
    <>
      Compose footer content after the scroll region inside{' '}
      <code>Sheet.Content</code>.
    </>,
  ],
  [
    'BottomSheetRef',
    <>Remove it; control active snap state with props and callbacks.</>,
  ],
  [
    'expandOnContentDrag',
    <>Remove it; gesture ownership now follows scroll boundaries.</>,
  ],
  [
    'stylesheet imports',
    <>
      Replace <code>/style.css</code> or <code>/dist/style.css</code> with{' '}
      <code>/styles.css</code>; use <code>/core.css</code> for a full restyle.
    </>,
  ],
]

export function MigrationPageContent({
  installCommand,
  beforeExample,
  afterExample,
}: MigrationPageContentProps) {
  return (
    <main id="content" className="docs-page docs-migration-page" tabIndex={-1}>
      <article className="docs-migration-article">
        <header>
          <p className="docs-route">migration / react-spring-bottom-sheet</p>
          <h1>Migrate from react-spring-bottom-sheet</h1>
          <p className="docs-migration-intro">
            This is an independently maintained continuation for React 19. Move
            deliberately from <code>react-spring-bottom-sheet</code> to{' '}
            <code>@nipe-solutions/react-spring-bottom-sheet</code> with a
            documented API and styling path.
          </p>
          {installCommand}
        </header>

        <section aria-labelledby="migration-path-title">
          <h2 id="migration-path-title">Choose your path</h2>
          <div className="docs-migration-paths">
            <div>
              <h3>Evaluate version 5</h3>
              <p>
                Choose the React 19 package when its explicit controlled state,
                composable parts, and styling contracts fit your next release.
              </p>
            </div>
            <div>
              <h3>Stay with the original for now</h3>
              <p>
                Keep the original package until a migration is practical. The
                complete guide records the mapping so you can plan the change
                without treating it as a drop-in upgrade.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="migration-example-title">
          <h2 id="migration-example-title">
            Controlled state before and after
          </h2>
          <p>
            The migration changes a monolithic component into explicit
            composition while keeping application state under your control.
          </p>
          <div className="docs-migration-examples">
            <div>
              <h3>Original package</h3>
              {beforeExample}
            </div>
            <div>
              <h3>React 19 continuation</h3>
              {afterExample}
            </div>
          </div>
        </section>

        <section aria-labelledby="migration-mapping-title">
          <h2 id="migration-mapping-title">API and styling mapping</h2>
          <div
            aria-label="Migration API mapping"
            className="docs-migration-table-wrap"
            role="region"
            tabIndex={0}
          >
            <table className="docs-migration-table">
              <caption>Version 4 to version 5 migration mapping</caption>
              <thead>
                <tr>
                  <th scope="col">Original API</th>
                  <th scope="col">Version 5 path</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(([original, replacement]) => (
                  <tr key={original}>
                    <th scope="row">
                      <code>{original}</code>
                    </th>
                    <td>{replacement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            See the <a href="/docs/migration/">complete migration guide</a> for
            callback, CSS selector, and import detail.
          </p>
        </section>

        <section aria-labelledby="migration-requirements-title">
          <h2 id="migration-requirements-title">Requirements</h2>
          <p>
            Version 5 requires React 19 and is verified in current Chromium,
            Firefox, and WebKit browsers.
          </p>
        </section>

        <section aria-labelledby="migration-next-title">
          <h2 id="migration-next-title">Continue the evaluation</h2>
          <nav className="docs-migration-actions" aria-label="Migration links">
            <Link href="/examples/">Examples</Link>
            <Link href="/docs/migration/">Full migration guide</Link>
            <Link href="/docs/api/">API reference</Link>
            <a href="https://www.npmjs.com/package/@nipe-solutions/react-spring-bottom-sheet">
              npm
            </a>
            <a href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet">
              GitHub
            </a>
          </nav>
        </section>

        <aside className="docs-migration-lineage">
          <h2>Lineage</h2>
          <p>
            The original project was created by Cody Olsen and maintained with
            Jasmine GH. NIPE Solutions independently maintains this React 19
            continuation.
          </p>
        </aside>
      </article>
    </main>
  )
}
