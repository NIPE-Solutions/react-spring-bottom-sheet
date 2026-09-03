import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="docs-footer">
      <div>
        <span>MIT licensed · independently maintained by NIPE Solutions</span>
        <a href="https://github.com/stipsan/react-spring-bottom-sheet">
          Original project
        </a>
      </div>
      <nav aria-label="Legal navigation">
        <Link href="/accessibility/">Accessibility</Link>
        <Link href="/impressum/">Impressum</Link>
        <Link href="/privacy/">Privacy</Link>
        <Link href="/de/datenschutz/" lang="de">
          Datenschutz
        </Link>
      </nav>
    </footer>
  )
}
