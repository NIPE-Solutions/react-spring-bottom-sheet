import type { ReactNode } from 'react'
import { SiteFooter } from '../../components/SiteFooter'
import { SiteHeader } from '../../components/SiteHeader'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="docs-skip-link" href="#content">
        Skip to content
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  )
}
