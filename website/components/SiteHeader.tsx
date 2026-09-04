import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="docs-header">
      <Link className="docs-wordmark" href="/">
        <span aria-hidden="true" className="docs-wordmark-mark" />
        React Spring Bottom Sheet
      </Link>
      <div className="docs-collection">
        <span>Primitives</span>
        <a href="https://opensource.nipesolutions.com">NIPE Open Source</a>
      </div>
      <nav aria-label="Primary navigation">
        <Link href="/docs/introduction/">Docs</Link>
        <Link href="/examples/">Examples</Link>
        <Link href="/migration-from-react-spring-bottom-sheet/">Migration</Link>
        <a href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet">
          GitHub
        </a>
      </nav>
    </header>
  )
}
