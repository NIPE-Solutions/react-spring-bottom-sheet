import Link from 'next/link'
import { docGroups, getDocsByGroup } from '../content/navigation'

interface DocsNavigationProps {
  currentSlug: string
  label?: string
}

export function DocsNavigation({
  currentSlug,
  label = 'Documentation',
}: DocsNavigationProps) {
  return (
    <nav className="docs-navigation" aria-label={label}>
      {docGroups.map((group) => (
        <div className="docs-navigation-group" key={group.id}>
          <p>{group.label}</p>
          <ul>
            {getDocsByGroup(group.id).map((page) => (
              <li key={page.slug}>
                <Link
                  aria-current={page.slug === currentSlug ? 'page' : undefined}
                  href={`/docs/${page.slug}/`}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
