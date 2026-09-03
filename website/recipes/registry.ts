import { BasicSheet } from './basic/BasicSheet'
import { ControlledSheet } from './controlled/ControlledSheet'
import { ContentHeightSheet } from './content-height/ContentHeightSheet'
import { FormSheet } from './form/FormSheet'
import { CustomPortalSheet } from './custom-portal/CustomPortalSheet'
import { NonModalSheet } from './non-modal/NonModalSheet'
import { ReducedMotionSheet } from './reduced-motion/ReducedMotionSheet'
import { ScrollingSheet } from './scrolling/ScrollingSheet'
import { SnapPointSheet } from './snap-points/SnapPointSheet'
import { ConfirmationSheet } from './confirmation/ConfirmationSheet'
import { CustomThemeSheet } from './custom-theme/CustomThemeSheet'
import { DarkThemeSheet } from './dark-theme/DarkThemeSheet'
import type { RecipeDefinition } from './types'

export const recipes = [
  {
    slug: 'basic',
    title: 'Basic sheet',
    summary: 'Start with local state and a content-sized destination.',
    component: BasicSheet,
    sourceFile: 'basic/BasicSheet.tsx',
    relatedDocs: ['installation', 'anatomy'],
    prerequisites: ['React 19 and the package default stylesheet.'],
    behavior: ['Root keeps open state locally and sizes to its content.'],
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
    sourceFile: 'controlled/ControlledSheet.tsx',
    relatedDocs: ['state', 'accessibility'],
    prerequisites: ['An application state owner for the open value.'],
    behavior: ['Every dismissal route requests the same state update.'],
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
    sourceFile: 'snap-points/SnapPointSheet.tsx',
    relatedDocs: ['snap-points', 'gestures'],
    prerequisites: ['Two named destinations with distinct layout values.'],
    behavior: ['Buttons and drag gestures update the controlled destination.'],
    accessibility: [
      'Snap controls expose their selected state with aria-pressed.',
      'The current destination is announced through a polite live region.',
    ],
  },
  {
    slug: 'content-height',
    title: 'Content height',
    summary: 'Let measured content define the sheet destination as it changes.',
    component: ContentHeightSheet,
    sourceFile: 'content-height/ContentHeightSheet.tsx',
    relatedDocs: ['snap-points', 'anatomy'],
    prerequisites: ['Content whose rendered height can change.'],
    behavior: [
      'The content destination is measured again after layout changes.',
    ],
    accessibility: [
      'Dynamic content remains inside the named dialog.',
      'The explicit Done control restores focus to the trigger.',
    ],
  },
  {
    slug: 'scrolling',
    title: 'Long scrolling content',
    summary:
      'Coordinate sheet gestures with a long, keyboard-scrollable region.',
    component: ScrollingSheet,
    sourceFile: 'scrolling/ScrollingSheet.tsx',
    relatedDocs: ['gestures', 'accessibility'],
    prerequisites: ['A bounded descendant with overflow enabled.'],
    behavior: [
      'Scroll keeps the gesture until it reaches a directional boundary.',
    ],
    accessibility: [
      'The scroll container is a named keyboard-focusable region.',
      'Closing restores focus to the opening control.',
    ],
  },
  {
    slug: 'form',
    title: 'Form and keyboard',
    summary:
      'Keep form submission explicit while virtual keyboards resize the viewport.',
    component: FormSheet,
    sourceFile: 'form/FormSheet.tsx',
    relatedDocs: ['state', 'accessibility'],
    prerequisites: ['A controlled open value and an ordinary HTML form.'],
    behavior: ['Submit saves and closes; cancel closes without submitting.'],
    accessibility: [
      'Every field has a persistent visible label.',
      'Cancel and submit are separate, clearly named actions.',
    ],
  },
  {
    slug: 'custom-portal',
    title: 'Custom portal target',
    summary:
      'Contain the sheet within an application-owned rendering boundary.',
    component: CustomPortalSheet,
    sourceFile: 'custom-portal/CustomPortalSheet.tsx',
    relatedDocs: ['anatomy', 'styling'],
    prerequisites: [
      'A mounted application-owned container that establishes a fixed-position containing block.',
    ],
    behavior: [
      'Portal measures and mounts every sheet layer inside the supplied container.',
    ],
    accessibility: [
      'Portalling does not change the dialog name or keyboard behavior.',
      'The target clips the visual layer without hiding the trigger.',
    ],
  },
  {
    slug: 'non-modal',
    title: 'Non-modal panel',
    summary: 'Keep the surrounding page interactive beside a persistent sheet.',
    component: NonModalSheet,
    sourceFile: 'non-modal/NonModalSheet.tsx',
    relatedDocs: ['state', 'accessibility'],
    prerequisites: ['A workflow that must coexist with page interaction.'],
    behavior: ['Non-modal mode leaves surrounding controls available.'],
    accessibility: [
      'The dialog omits aria-modal and does not contain focus.',
      'A visible close control remains available.',
    ],
  },
  {
    slug: 'reduced-motion',
    title: 'Reduced motion',
    summary:
      'Honor the operating system preference without maintaining a second component.',
    component: ReducedMotionSheet,
    sourceFile: 'reduced-motion/ReducedMotionSheet.tsx',
    relatedDocs: ['accessibility', 'troubleshooting'],
    prerequisites: ['No application-specific motion branch is required.'],
    behavior: [
      'Transitions follow the operating system preference automatically.',
    ],
    accessibility: [
      'The library reads prefers-reduced-motion for every transition.',
      'Dialog semantics and focus behavior remain unchanged.',
    ],
  },
  {
    slug: 'custom-theme',
    title: 'Complete custom theme',
    summary:
      'Replace every visual decision while retaining the mechanical layer.',
    component: CustomThemeSheet,
    sourceFile: 'custom-theme/CustomThemeSheet.tsx',
    relatedDocs: ['styling', 'accessibility'],
    prerequisites: [
      'Import core.css and keep theme selectors in an application-owned namespace.',
    ],
    behavior: [
      'Application styles replace the default surface, handle, backdrop, and controls.',
    ],
    accessibility: [
      'Focus indicators remain visible against the custom palette.',
      'Text and controls retain sufficient contrast.',
    ],
  },
  {
    slug: 'dark-theme',
    title: 'Explicit dark theme',
    summary:
      'Ship a dark surface that does not depend on the operating system preference.',
    component: DarkThemeSheet,
    sourceFile: 'dark-theme/DarkThemeSheet.tsx',
    relatedDocs: ['styling', 'accessibility'],
    prerequisites: [
      'Import core.css and scope the dark palette to this sheet.',
    ],
    behavior: [
      'The theme remains dark in both light and dark operating system modes.',
    ],
    accessibility: [
      'The muted cyan focus ring remains visible on every dark surface.',
      'Status information uses text rather than color alone.',
    ],
  },
  {
    slug: 'confirmation',
    title: 'Explicit confirmation',
    summary:
      'Require a deliberate choice before closing a destructive workflow.',
    component: ConfirmationSheet,
    sourceFile: 'confirmation/ConfirmationSheet.tsx',
    relatedDocs: ['state', 'accessibility'],
    prerequisites: ['Controlled open state for both explicit outcomes.'],
    behavior: ['Escape, backdrop, and drag dismissal remain disabled.'],
    accessibility: [
      'Escape and backdrop dismissal are disabled while a decision is required.',
      'Both outcomes use explicit text instead of color alone.',
    ],
  },
] as const satisfies readonly RecipeDefinition[]

export function getRecipe(slug: string): RecipeDefinition | undefined {
  return recipes.find((recipe) => recipe.slug === slug)
}
