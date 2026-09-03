import type { DocHeading } from '../content/types'

export function TableOfContents({
  headings,
  label = 'On this page',
}: {
  headings: readonly DocHeading[]
  label?: string
}) {
  if (headings.length === 0) return null

  return (
    <nav className="docs-table-of-contents" aria-label={label}>
      <p>On this page</p>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`}>{heading.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
