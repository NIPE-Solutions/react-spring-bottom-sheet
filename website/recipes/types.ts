import type { ComponentType } from 'react'

export interface RecipeDefinition {
  slug: string
  title: string
  summary: string
  component: ComponentType
  source: string
  relatedDocs: readonly string[]
  prerequisites: readonly string[]
  behavior: readonly string[]
  accessibility: readonly string[]
}
