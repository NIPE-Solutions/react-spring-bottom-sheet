import Link from 'next/link'

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
        <pre className="docs-install" tabIndex={0}>
          <code>npm install @nipe-solutions/react-spring-bottom-sheet</code>
        </pre>
        <Link href="/docs/installation/">Follow the installation guide</Link>
      </div>
      <pre className="docs-quick-start-code" tabIndex={0}>
        <code>{quickStartSource}</code>
      </pre>
    </section>
  )
}
