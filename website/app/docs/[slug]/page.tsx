import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { docs, getDoc } from '../../../content/docs.mjs'

export const dynamicParams = false

export function generateStaticParams() {
  return docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getDoc(slug)
  return page
    ? {
        title: page.title,
        description: page.description,
        alternates: { canonical: `/docs/${slug}/` },
      }
    : {}
}

export default async function Doc({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = getDoc(slug)
  if (!page) notFound()

  return (
    <main id="content" className="docs-page" tabIndex={-1}>
      <header>
        <p className="docs-route">docs / {page.slug}</p>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </header>
      {page.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
          {section.code ? (
            <pre>
              <code>{section.code}</code>
            </pre>
          ) : null}
        </section>
      ))}
      {slug === 'migration' ? (
        <p>
          <a href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet/blob/v5/docs/migration-v4-to-v5.md">
            Read the complete migration guide
          </a>
        </p>
      ) : null}
    </main>
  )
}
