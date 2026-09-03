import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import '../../src/styles/styles.css'
import './site.css'

const siteUrl = 'https://react-spring-bottom-sheet.nipesolutions.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'React Spring Bottom Sheet',
    template: '%s · React Spring Bottom Sheet',
  },
  description:
    'Accessible, composable bottom sheets for React 19 with predictable gestures, explicit state, and complete styling control.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'React Spring Bottom Sheet',
    description:
      'Accessible, composable bottom sheets for React 19 with predictable gestures, explicit state, and complete styling control.',
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
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
