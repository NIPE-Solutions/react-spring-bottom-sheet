import type { ReactNode } from 'react'

import { legalOperator } from '../content/legal'

type LegalSection = {
  title: string
  content: ReactNode
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  sections: readonly LegalSection[]
}) {
  return (
    <main id="content" className="docs-legal-page" tabIndex={-1}>
      <header>
        <p className="docs-route">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="docs-legal-intro">{intro}</p>
      </header>
      <div className="docs-legal-layout">
        <article>
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
        </article>
        <aside aria-label="Operator contact">
          <p>{legalOperator.company}</p>
          <p>
            {legalOperator.street}
            <br />
            {legalOperator.city}
            <br />
            {legalOperator.country}
          </p>
          <p>
            <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>
          </p>
        </aside>
      </div>
    </main>
  )
}
