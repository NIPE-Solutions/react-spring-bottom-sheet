import { expect, test } from 'vitest'
import { docs } from './docs'
import {
  docGroups,
  getAdjacentDocs,
  getDocHeadings,
  getDocsByGroup,
} from './navigation'

test('documentation routes and heading identifiers are unique', () => {
  const slugs = docs.map(({ slug }) => slug)
  expect(new Set(slugs).size).toBe(slugs.length)

  for (const page of docs) {
    const headings = getDocHeadings(page).map(({ id }) => id)
    expect(new Set(headings).size, page.slug).toBe(headings.length)
  }
})

test('groups expose pages in contiguous order', () => {
  expect(docGroups.map(({ id }) => id)).toEqual([
    'learn',
    'reference',
    'project',
  ])

  for (const group of docGroups) {
    expect(getDocsByGroup(group.id).map(({ order }) => order)).toEqual(
      Array.from(
        { length: getDocsByGroup(group.id).length },
        (_, index) => index + 1,
      ),
    )
  }
})

test('adjacent documentation follows visible navigation order', () => {
  expect(getAdjacentDocs('introduction').previous).toBeUndefined()
  expect(getAdjacentDocs('introduction').next?.slug).toBe('installation')
  expect(getAdjacentDocs('state').previous?.slug).toBe('anatomy')
  expect(getAdjacentDocs('state').next?.slug).toBe('snap-points')
  expect(getAdjacentDocs('migration').next?.slug).toBe('troubleshooting')
  expect(getAdjacentDocs('missing')).toEqual({})
})

test('headings retain explicit identifiers for stable fragment links', () => {
  const snapPoints = docs.find(({ slug }) => slug === 'snap-points')
  expect(snapPoints).toBeDefined()
  if (!snapPoints) throw new Error('snap-points page is missing')

  expect(getDocHeadings(snapPoints)).toEqual([
    { id: 'values', label: 'Values', depth: 2 },
    { id: 'reconciliation', label: 'Reconciliation', depth: 2 },
  ])
})
