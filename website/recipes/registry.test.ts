import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { docs } from '../content/docs'
import { getRecipe, recipes } from './registry'

describe('recipe registry', () => {
  it('uses unique slugs and resolves every registered recipe', () => {
    const slugs = recipes.map(({ slug }) => slug)

    expect(new Set(slugs).size).toBe(slugs.length)
    for (const recipe of recipes) {
      expect(getRecipe(recipe.slug)).toBe(recipe)
    }
    expect(getRecipe('missing')).toBeUndefined()
  })

  it('provides useful copy and source for every recipe', () => {
    for (const recipe of recipes) {
      expect(recipe.title.trim()).not.toBe('')
      expect(recipe.summary.trim()).not.toBe('')
      expect(recipe.source.trim()).not.toBe('')
      expect(recipe.source).toContain("from '@library'")
    }
  })

  it('consumes the package through its public website alias', () => {
    for (const file of [
      'basic/BasicSheet.tsx',
      'controlled/ControlledSheet.tsx',
      'snap-points/SnapPointSheet.tsx',
    ]) {
      const component = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(component).toContain("from '@library'")
      expect(component).not.toMatch(/from ['"](?:\.\.\/)+.*src/)
    }
  })

  it('links only to registered documentation pages', () => {
    const docSlugs = new Set(docs.map(({ slug }) => slug))

    for (const recipe of recipes) {
      expect(recipe.relatedDocs.length).toBeGreaterThan(0)
      for (const slug of recipe.relatedDocs)
        expect(docSlugs.has(slug)).toBe(true)
    }
  })

  it('includes concrete accessibility guidance', () => {
    for (const recipe of recipes) {
      expect(recipe.accessibility.length).toBeGreaterThan(0)
      for (const note of recipe.accessibility) expect(note.trim()).not.toBe('')
    }
  })
})
