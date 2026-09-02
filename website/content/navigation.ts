import { docs } from './docs'
import type { DocGroup, DocGroupId, DocHeading, DocPage } from './types'

export const docGroups = [
  { id: 'learn', label: 'Learn' },
  { id: 'reference', label: 'Reference' },
  { id: 'project', label: 'Project' },
] as const satisfies readonly DocGroup[]

export function getDoc(slug: string): DocPage | undefined {
  return docs.find((page) => page.slug === slug)
}

export function getDocsByGroup(group: DocGroupId): readonly DocPage[] {
  return docs
    .filter((page) => page.group === group)
    .toSorted((left, right) => left.order - right.order)
}

export function getOrderedDocs(): readonly DocPage[] {
  return docGroups.flatMap((group) => getDocsByGroup(group.id))
}

export function getAdjacentDocs(slug: string): {
  previous?: DocPage
  next?: DocPage
} {
  const ordered = getOrderedDocs()
  const index = ordered.findIndex((page) => page.slug === slug)
  if (index === -1) return {}

  return {
    previous: ordered[index - 1],
    next: ordered[index + 1],
  }
}

export function getDocHeadings(page: DocPage): readonly DocHeading[] {
  return page.sections.map((section) => ({
    id: section.id,
    label: section.title,
    depth: 2,
  }))
}
