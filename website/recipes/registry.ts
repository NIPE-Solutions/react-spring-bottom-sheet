import { BasicSheet } from './basic/BasicSheet'
import { basicSource } from './basic/source'
import { ControlledSheet } from './controlled/ControlledSheet'
import { controlledSource } from './controlled/source'
import { SnapPointSheet } from './snap-points/SnapPointSheet'
import { snapPointSource } from './snap-points/source'
import type { RecipeDefinition } from './types'

export const recipes = [
  {
    slug: 'basic',
    title: 'Basic sheet',
    summary: 'Start with local state and a content-sized destination.',
    component: BasicSheet,
    source: basicSource,
    relatedDocs: ['installation', 'anatomy'],
    accessibility: [
      'Sheet.Title names the dialog and Sheet.Description explains its purpose.',
      'Focus returns to the trigger after the sheet closes.',
    ],
  },
  {
    slug: 'controlled',
    title: 'Controlled state',
    summary:
      'Keep the open state in your application when other UI depends on it.',
    component: ControlledSheet,
    source: controlledSource,
    relatedDocs: ['state', 'accessibility'],
    accessibility: [
      'The visible state message is a polite live region.',
      'Escape and the close control both request the same controlled state change.',
    ],
  },
  {
    slug: 'snap-points',
    title: 'Named snap points',
    summary:
      'Control compact and expanded destinations with stable identifiers.',
    component: SnapPointSheet,
    source: snapPointSource,
    relatedDocs: ['snap-points', 'gestures'],
    accessibility: [
      'Snap controls expose their selected state with aria-pressed.',
      'The current destination is announced through a polite live region.',
    ],
  },
] as const satisfies readonly RecipeDefinition[]

export function getRecipe(slug: string): RecipeDefinition | undefined {
  return recipes.find((recipe) => recipe.slug === slug)
}
