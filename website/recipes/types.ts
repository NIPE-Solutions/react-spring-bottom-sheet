import type { ComponentType } from 'react'

export type RecipeSourceFileBySlug = Readonly<{
  basic: 'basic/BasicSheet.tsx'
  controlled: 'controlled/ControlledSheet.tsx'
  'snap-points': 'snap-points/SnapPointSheet.tsx'
  'content-height': 'content-height/ContentHeightSheet.tsx'
  scrolling: 'scrolling/ScrollingSheet.tsx'
  form: 'form/FormSheet.tsx'
  'custom-portal': 'custom-portal/CustomPortalSheet.tsx'
  'non-modal': 'non-modal/NonModalSheet.tsx'
  'reduced-motion': 'reduced-motion/ReducedMotionSheet.tsx'
  'custom-theme': 'custom-theme/CustomThemeSheet.tsx'
  'dark-theme': 'dark-theme/DarkThemeSheet.tsx'
  confirmation: 'confirmation/ConfirmationSheet.tsx'
}>

export type RecipeSlug = keyof RecipeSourceFileBySlug

export type RecipeSourceFile = RecipeSourceFileBySlug[RecipeSlug]

export type RecipeSourceRegistration = {
  [Slug in RecipeSlug]: Readonly<{
    slug: Slug
    sourceFile: RecipeSourceFileBySlug[Slug]
  }>
}[RecipeSlug]

type RecipeDetails = Readonly<{
  title: string
  summary: string
  component: ComponentType
  relatedDocs: readonly string[]
  prerequisites: readonly string[]
  behavior: readonly string[]
  accessibility: readonly string[]
}>

export type RecipeDefinition = RecipeSourceRegistration & RecipeDetails
