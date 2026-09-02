import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { docs } from '../content/docs.mjs'
import '../../src/styles/styles.css'
import './site.css'

const siteUrl = 'https://react-spring-bottom-sheet.nipesolutions.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'React Spring Bottom Sheet',
    template: '%s · React Spring Bottom Sheet',
  },
  description: 'Accessible, composable bottom sheets for React 19.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'React Spring Bottom Sheet',
    description: 'Accessible, composable bottom sheets for React 19.',
    url: siteUrl,
    siteName: 'React Spring Bottom Sheet',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="docs-skip-link" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        <div className="docs-site-grid">
          <aside className="docs-sidebar" aria-label="Documentation">
            <p>Version 5 alpha</p>
            {docs.map((page) => (
              <Link key={page.slug} href={`/docs/${page.slug}/`}>
                {page.title}
              </Link>
            ))}
          </aside>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  )
}
