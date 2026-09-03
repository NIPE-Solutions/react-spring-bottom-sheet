import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getRecipe } from './registry'
import { loadRecipeSource } from './source'
import type { RecipeSourceFile } from './types'

describe('recipe source loader', () => {
  it('returns the registered component source byte-for-byte', async () => {
    const recipe = getRecipe('basic')
    expect(recipe).toBeDefined()

    const expectedSource = await readFile(
      resolve(dirname(fileURLToPath(import.meta.url)), 'basic/BasicSheet.tsx'),
      'utf8',
    )

    await expect(loadRecipeSource(recipe!.sourceFile)).resolves.toEqual({
      filename: 'BasicSheet.tsx',
      source: expectedSource,
    })
  })

  it('rejects a missing component source', async () => {
    await expect(
      loadRecipeSource('basic/MissingSheet.tsx' as RecipeSourceFile),
    ).rejects.toThrow(/ENOENT/)
  })

  it.each(['../package.json', '/tmp/Recipe.tsx'])(
    'rejects a source path outside website/recipes: %s',
    async (sourceFile) => {
      await expect(
        loadRecipeSource(sourceFile as RecipeSourceFile),
      ).rejects.toThrow('Recipe source must remain inside website/recipes')
    },
  )

  it('rejects a source that is not TSX', async () => {
    await expect(
      loadRecipeSource('basic/source.ts' as RecipeSourceFile),
    ).rejects.toThrow('Recipe source must be a .tsx file')
  })
})
