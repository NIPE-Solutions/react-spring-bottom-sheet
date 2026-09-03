import type { ComponentType } from 'react'

export type RecipeSourceFile =
  | 'basic/BasicSheet.tsx'
  | 'controlled/ControlledSheet.tsx'
  | 'snap-points/SnapPointSheet.tsx'
  | 'content-height/ContentHeightSheet.tsx'
  | 'scrolling/ScrollingSheet.tsx'
  | 'form/FormSheet.tsx'
  | 'custom-portal/CustomPortalSheet.tsx'
  | 'non-modal/NonModalSheet.tsx'
  | 'reduced-motion/ReducedMotionSheet.tsx'
  | 'custom-theme/CustomThemeSheet.tsx'
  | 'dark-theme/DarkThemeSheet.tsx'
  | 'confirmation/ConfirmationSheet.tsx'

export interface RecipeDefinition {
  slug: string
  title: string
  summary: string
  component: ComponentType
  sourceFile: RecipeSourceFile
  relatedDocs: readonly string[]
  prerequisites: readonly string[]
  behavior: readonly string[]
  accessibility: readonly string[]
}
