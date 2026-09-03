import Link from 'next/link'
import { buildEvidence } from '../content/evidence'
import { getReleasePresentation } from '../content/release'

const quickStartSource = `import { Sheet } from '@nipe-solutions/react-spring-bottom-sheet'
import '@nipe-solutions/react-spring-bottom-sheet/styles.css'

export function App() {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Open sheet</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Account settings</Sheet.Title>
            <Sheet.Description>Update your profile.</Sheet.Description>
            <Sheet.Close>Done</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}`

export function QuickStart() {
  const release = getReleasePresentation(buildEvidence.version)

  return (
    <section className="docs-quick-start" aria-labelledby="quick-start-title">
      <div>
        <p>One package, explicit anatomy</p>
        <h2 id="quick-start-title">Start with the whole system.</h2>
        <p>
          The default stylesheet includes mechanics and theme. Every interactive
          part stays visible in the component tree, so behavior is easy to find
          and change.
        </p>
        {release.prerelease && !release.published ? (
          <p className="docs-install-label">After prerelease publication</p>
        ) : null}
        <pre className="docs-install" tabIndex={0}>
          <code>{release.installCommand}</code>
        </pre>
        <Link href="/docs/installation/">Follow the installation guide</Link>
      </div>
      <pre className="docs-quick-start-code" tabIndex={0}>
        <code>{quickStartSource}</code>
      </pre>
    </section>
  )
}
