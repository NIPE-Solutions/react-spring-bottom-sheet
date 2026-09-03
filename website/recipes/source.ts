import { readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RecipeSourceFile } from './types'

const recipesDirectory = dirname(fileURLToPath(import.meta.url))

export async function loadRecipeSource(sourceFile: RecipeSourceFile): Promise<{
  filename: string
  source: string
}> {
  const absolutePath = resolve(recipesDirectory, sourceFile)
  const relativePath = relative(recipesDirectory, absolutePath)

  if (isAbsolute(relativePath) || relativePath.startsWith('..')) {
    throw new Error('Recipe source must remain inside website/recipes')
  }

  if (!absolutePath.endsWith('.tsx')) {
    throw new Error('Recipe source must be a .tsx file')
  }

  return {
    filename: basename(absolutePath),
    source: await readFile(absolutePath, 'utf8'),
  }
}
