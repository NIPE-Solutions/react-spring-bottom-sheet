import type { RecipeSourceRegistration } from '../../website/recipes/types'

const basicSource: RecipeSourceRegistration = {
  slug: 'basic',
  sourceFile: 'basic/BasicSheet.tsx',
}

const controlledSource: RecipeSourceRegistration = {
  slug: 'controlled',
  sourceFile: 'controlled/ControlledSheet.tsx',
}

// @ts-expect-error A valid recipe source cannot be registered for another slug.
const swappedBasicSource: RecipeSourceRegistration = {
  slug: 'basic',
  sourceFile: 'controlled/ControlledSheet.tsx',
}

// @ts-expect-error Swapping two otherwise valid sources must remain invalid.
const swappedControlledSource: RecipeSourceRegistration = {
  slug: 'controlled',
  sourceFile: 'basic/BasicSheet.tsx',
}

void basicSource
void controlledSource
void swappedBasicSource
void swappedControlledSource
