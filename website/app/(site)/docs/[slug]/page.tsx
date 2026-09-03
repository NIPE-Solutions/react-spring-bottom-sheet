import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocsShell } from '../../../../components/DocsShell'
import { CodeBlock } from '../../../../components/source-code/CodeBlock'
import { docs } from '../../../../content/docs'
import {
  getAdjacentDocs,
  getDoc,
  getDocHeadings,
} from '../../../../content/navigation'
import { getLearnGuide } from '../../../../content/learn'
import { getReferenceGuide } from '../../../../content/reference'

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
  const headings = getDocHeadings(page)
  const { previous, next } = getAdjacentDocs(slug)
  const Guide = getLearnGuide(slug) ?? getReferenceGuide(slug)
  const genericSections = Guide
    ? null
    : await Promise.all(
        page.sections.map(async (section) => (
          <section id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.code
              ? await CodeBlock({
                  source: section.code.source,
                  language: section.code.language,
                  lineNumbers: section.code.lineNumbers,
                })
              : null}
            {section.link ? (
              <p>
                <Link href={section.link.href}>{section.link.label}</Link>
              </p>
            ) : null}
          </section>
        )),
      )

  return (
    <DocsShell
      currentPage={page}
      headings={headings}
      previous={previous}
      next={next}
    >
      <header>
        <p className="docs-route">docs / {page.slug}</p>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </header>
      {Guide ? <Guide /> : genericSections}
      {slug === 'migration' ? (
        <p>
          <a href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet/blob/v5/docs/migration-v4-to-v5.md">
            Read the complete migration guide
          </a>
        </p>
      ) : null}
    </DocsShell>
  )
}
