export interface PublicApiMemberContent {
  description: string
  defaultValue?: string
}

export interface PublicApiContent {
  summary: string
  members?: Readonly<Record<string, PublicApiMemberContent>>
  notes?: readonly string[]
}

export const publicApiBehaviorKeys = [
  'controlled-state',
  'dismissal',
  'focus',
  'portals',
  'reduced-motion',
] as const

export type PublicApiBehaviorKey = (typeof publicApiBehaviorKeys)[number]
export type PublicApiBehaviorMap = Readonly<
  Partial<Record<PublicApiBehaviorKey, string>>
>

export interface PublicApiMember {
  name: string
  signature: string
  required: boolean
}

export interface PublicApiEntry {
  id: string
  name: string
  kind: 'namespace' | 'component' | 'type'
  signature: string
  source: string
  members?: readonly PublicApiMember[]
}

export type PublicApiContentMap = Readonly<Record<string, PublicApiContent>>

export const publicApiSectionIds = [
  'composition',
  'primitives',
  'convenience-api',
  'public-types',
] as const

export type PublicApiSectionId = (typeof publicApiSectionIds)[number]

export interface PublicApiPresentation {
  section: PublicApiSectionId
  title: string
  caption?: string
  sourceLabel?: string
}

export type PublicApiPresentationMap = Readonly<
  Record<string, PublicApiPresentation>
>

export interface PublicApiReferenceItem {
  entry: PublicApiEntry
  content: PublicApiContent
  presentation: PublicApiPresentation
}

export type PublicApiReference = Readonly<
  Record<PublicApiSectionId, readonly PublicApiReferenceItem[]>
>

const requiredDefaults = {
  'bottom-sheet-props': new Set(['open', 'snapPoints', 'modal', 'dismissible']),
  'sheet-root-props': new Set(['open', 'snapPoints', 'modal', 'dismissible']),
} as const

const rootMembers = {
  children: {
    description: 'The composed sheet primitives rendered within this root.',
  },
  open: {
    description:
      'The controlled open state. Update it from onOpenChange when the sheet requests a change.',
    defaultValue: 'false',
  },
  defaultOpen: {
    description: 'The initial open state when open is uncontrolled.',
    defaultValue: 'false',
  },
  onOpenChange: {
    description:
      'Called with the requested open state and the interaction that requested it.',
  },
  snapPoints: {
    description: 'The named height destinations available to the sheet.',
    defaultValue: "[{ id: 'content', value: 'content' }]",
  },
  activeSnapPoint: {
    description:
      'The controlled snap-point id. Update it from onSnapPointChange after a drag selects a destination.',
  },
  defaultSnapPoint: {
    description:
      'The initial snap-point id when activeSnapPoint is uncontrolled.',
    defaultValue: 'first snap-point id',
  },
  onSnapPointChange: {
    description:
      'Called with the destination id when a drag selects a snap point.',
  },
  modal: {
    description:
      'Whether an open sheet contains focus and isolates the surrounding document.',
    defaultValue: 'true',
  },
  dismissible: {
    description:
      'Whether Escape, a direct backdrop click, and a downward drag can request closing.',
    defaultValue: 'true',
  },
} as const satisfies Readonly<Record<string, PublicApiMemberContent>>

const asChildMember = {
  asChild: {
    description:
      'Merges the primitive props and forwarded ref into one child element instead of rendering the default element.',
    defaultValue: 'false',
  },
} as const satisfies Readonly<Record<string, PublicApiMemberContent>>

export const publicApiContent = {
  sheet: {
    summary:
      'Compound components for assembling a sheet while Root coordinates shared state and behavior.',
    members: {
      Root: {
        description:
          'Provides open state, snap-point state, layout, motion, and interactions to the composed primitives.',
      },
      Trigger: {
        description:
          'Renders a button that requests opening; preventing its click event cancels the request.',
      },
      Portal: {
        description:
          'Mounts the present sheet subtree into document.body or a supplied container.',
      },
      Backdrop: {
        description:
          'Renders the backdrop and requests closing on an unprevented direct click when dismissal is enabled.',
      },
      Viewport: {
        description:
          'Renders and registers the element used to measure the sheet’s available space.',
      },
      Content: {
        description:
          'Renders the dialog surface, connects its accessible name and description, and handles focus and dragging.',
      },
      Handle: {
        description:
          'Renders the handle region; pointer gestures that start here are assigned to the sheet.',
      },
      Title: {
        description:
          'Renders a heading and registers its id as the dialog’s accessible name.',
      },
      Description: {
        description:
          'Renders a paragraph and registers its id as the dialog’s accessible description.',
      },
      Close: {
        description:
          'Renders a button that requests closing; preventing its click event cancels the request.',
      },
    },
  },
  'bottom-sheet': {
    summary:
      'Convenience component that composes Root, Portal, Backdrop, Viewport, Content, Handle, Title, and optional Description.',
  },
  'bottom-sheet-props': {
    summary:
      'Props for BottomSheet, combining the Root contract with the standard composed content.',
    members: {
      children: {
        description:
          'Content rendered after the generated handle, title, and optional description.',
      },
      title: {
        description: 'Content rendered in Sheet.Title as the dialog name.',
      },
      description: {
        description:
          'Optional content rendered in Sheet.Description as the dialog description.',
      },
      backdropProps: {
        description: 'Props forwarded to the composed Sheet.Backdrop.',
      },
      contentProps: {
        description: 'Props forwarded to the composed Sheet.Content.',
      },
      viewportProps: {
        description: 'Props forwarded to the composed Sheet.Viewport.',
      },
      open: rootMembers.open,
      defaultOpen: rootMembers.defaultOpen,
      onOpenChange: rootMembers.onOpenChange,
      snapPoints: rootMembers.snapPoints,
      activeSnapPoint: rootMembers.activeSnapPoint,
      defaultSnapPoint: rootMembers.defaultSnapPoint,
      onSnapPointChange: rootMembers.onSnapPointChange,
      modal: rootMembers.modal,
      dismissible: rootMembers.dismissible,
    },
  },
  'sheet-root-props': {
    summary: 'Props controlling state and behavior for Sheet.Root.',
    members: rootMembers,
  },
  'sheet-trigger-props': {
    summary:
      'Native button props for Sheet.Trigger, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-portal-props': {
    summary: 'Props selecting the subtree and DOM target for Sheet.Portal.',
    members: {
      children: {
        description: 'The sheet subtree to render while the sheet is present.',
      },
      container: {
        description:
          'The element or document fragment that receives the portal; null also falls back to document.body.',
        defaultValue: 'document.body',
      },
    },
  },
  'sheet-backdrop-props': {
    summary:
      'Native div props for Sheet.Backdrop, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-viewport-props': {
    summary:
      'Native div props for Sheet.Viewport, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-content-props': {
    summary:
      'Native div props for Sheet.Content, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-handle-props': {
    summary:
      'Native div props for Sheet.Handle, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-title-props': {
    summary:
      'Native heading props for Sheet.Title, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-description-props': {
    summary:
      'Native paragraph props for Sheet.Description, including support for a custom child element.',
    members: asChildMember,
  },
  'sheet-close-props': {
    summary:
      'Native button props for Sheet.Close, including support for a custom child element.',
    members: asChildMember,
  },
  'open-change-details': {
    summary: 'Details accompanying an onOpenChange request.',
    members: {
      reason: {
        description: 'The interaction that requested the open-state change.',
      },
    },
  },
  'open-change-reason': {
    summary:
      'Union of trigger, close, escape, backdrop, drag, and imperative change reasons.',
    notes: [
      'Component interactions report trigger, close, escape, backdrop, or drag. Imperative is reserved by the public reason type.',
    ],
  },
  'snap-point': {
    summary: 'A named sheet destination and the height it resolves to.',
    members: {
      id: {
        description:
          'A unique, stable identifier used by snap-point state and callbacks.',
      },
      value: {
        description: 'The fraction, CSS length, or content height to resolve.',
      },
    },
  },
  'snap-point-value': {
    summary:
      'A number from greater than zero through one for an available-height fraction, a positive px or percentage string, or content for measured content height.',
    notes: [
      'Resolved heights are capped at the viewport space remaining after safe-area insets; invalid values are ignored.',
    ],
  },
} as const satisfies PublicApiContentMap

export const publicApiBehavior = {
  'controlled-state':
    'Controlled open and activeSnapPoint values remain authoritative; update them from their callbacks.',
  dismissal:
    'onOpenChange identifies trigger, close, Escape, backdrop, or drag requests. Setting dismissible to false blocks passive dismissal while Sheet.Close remains available.',
  focus:
    'Modal content moves focus inside, contains focus, isolates the background, and restores the previously focused element when it closes.',
  portals:
    'Portal defaults to document.body and keeps content mounted until the closing motion finishes.',
  'reduced-motion':
    'Transitions settle immediately when prefers-reduced-motion requests reduced motion.',
} as const satisfies Readonly<Record<PublicApiBehaviorKey, string>>

export const publicApiPresentation = {
  sheet: {
    section: 'primitives',
    title: 'Sheet',
    caption: 'Sheet namespace members',
  },
  'bottom-sheet': {
    section: 'convenience-api',
    title: 'BottomSheet',
  },
  'bottom-sheet-props': {
    section: 'convenience-api',
    title: 'BottomSheetProps',
    caption: 'BottomSheet props',
  },
  'sheet-root-props': {
    section: 'composition',
    title: 'Sheet.Root',
    caption: 'Sheet.Root props',
    sourceLabel: 'Sheet.Root',
  },
  'sheet-trigger-props': {
    section: 'primitives',
    title: 'Sheet.Trigger',
    caption: 'Sheet.Trigger props',
    sourceLabel: 'Sheet.Trigger',
  },
  'sheet-portal-props': {
    section: 'primitives',
    title: 'Sheet.Portal',
    caption: 'Sheet.Portal props',
    sourceLabel: 'Sheet.Portal',
  },
  'sheet-backdrop-props': {
    section: 'primitives',
    title: 'Sheet.Backdrop',
    caption: 'Sheet.Backdrop props',
    sourceLabel: 'Sheet.Backdrop',
  },
  'sheet-viewport-props': {
    section: 'primitives',
    title: 'Sheet.Viewport',
    caption: 'Sheet.Viewport props',
    sourceLabel: 'Sheet.Viewport',
  },
  'sheet-content-props': {
    section: 'primitives',
    title: 'Sheet.Content',
    caption: 'Sheet.Content props',
    sourceLabel: 'Sheet.Content',
  },
  'sheet-handle-props': {
    section: 'primitives',
    title: 'Sheet.Handle',
    caption: 'Sheet.Handle props',
    sourceLabel: 'Sheet.Handle',
  },
  'sheet-title-props': {
    section: 'primitives',
    title: 'Sheet.Title',
    caption: 'Sheet.Title props',
    sourceLabel: 'Sheet.Title',
  },
  'sheet-description-props': {
    section: 'primitives',
    title: 'Sheet.Description',
    caption: 'Sheet.Description props',
    sourceLabel: 'Sheet.Description',
  },
  'sheet-close-props': {
    section: 'primitives',
    title: 'Sheet.Close',
    caption: 'Sheet.Close props',
    sourceLabel: 'Sheet.Close',
  },
  'open-change-details': {
    section: 'public-types',
    title: 'OpenChangeDetails',
  },
  'open-change-reason': {
    section: 'public-types',
    title: 'OpenChangeReason',
  },
  'snap-point': {
    section: 'public-types',
    title: 'SnapPoint',
  },
  'snap-point-value': {
    section: 'public-types',
    title: 'SnapPointValue',
  },
} as const satisfies PublicApiPresentationMap

export function validatePublicApiContent(
  entries: readonly PublicApiEntry[],
  content: PublicApiContentMap,
  behavior: PublicApiBehaviorMap,
): readonly string[] {
  const errors: string[] = []
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))

  for (const entry of entries) {
    const entryContent = Object.hasOwn(content, entry.id)
      ? content[entry.id]
      : undefined

    if (!entryContent) {
      errors.push(
        `Missing content for public API entry "${entry.name}" (${entry.id}).`,
      )
      continue
    }

    if (!entryContent.summary?.trim()) {
      errors.push(
        `Missing summary for public API entry "${entry.name}" (${entry.id}).`,
      )
    }

    const generatedMemberNames = new Set(
      entry.members?.map((member) => member.name) ?? [],
    )
    const requiredEntryDefaults =
      requiredDefaults[entry.id as keyof typeof requiredDefaults]

    for (const member of entry.members ?? []) {
      const memberContent = entryContent.members?.[member.name]
      if (!memberContent?.description?.trim()) {
        errors.push(
          `Missing content for public API member "${entry.name}.${member.name}".`,
        )
      }
      if (
        requiredEntryDefaults?.has(member.name) &&
        !memberContent?.defaultValue?.trim()
      ) {
        errors.push(
          `Missing default for public API member "${entry.name}.${member.name}".`,
        )
      }
    }

    for (const memberName of Object.keys(entryContent.members ?? {})) {
      if (!generatedMemberNames.has(memberName)) {
        errors.push(
          `Unknown content for public API member "${entry.name}.${memberName}".`,
        )
      }
    }
  }

  for (const contentId of Object.keys(content)) {
    if (!entriesById.has(contentId)) {
      errors.push(`Unknown content for public API entry "${contentId}".`)
    }
  }

  for (const behaviorKey of publicApiBehaviorKeys) {
    if (!behavior[behaviorKey]?.trim()) {
      errors.push(`Missing behavioral guidance for "${behaviorKey}".`)
    }
  }

  const knownBehaviorKeys = new Set<string>(publicApiBehaviorKeys)
  for (const behaviorKey of Object.keys(behavior)) {
    if (!knownBehaviorKeys.has(behaviorKey)) {
      errors.push(`Unknown behavioral guidance for "${behaviorKey}".`)
    }
  }

  return errors
}

export function validatePublicApiPresentation(
  entries: readonly PublicApiEntry[],
  presentation: PublicApiPresentationMap,
): readonly string[] {
  const errors: string[] = []
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))

  for (const entry of entries) {
    if (!Object.hasOwn(presentation, entry.id)) {
      errors.push(
        `Missing presentation for public API entry "${entry.name}" (${entry.id}).`,
      )
    }
  }

  for (const presentationId of Object.keys(presentation)) {
    if (!entriesById.has(presentationId)) {
      errors.push(
        `Unknown presentation for public API entry "${presentationId}".`,
      )
    }
  }

  return errors
}

export function createPublicApiReference(
  entries: readonly PublicApiEntry[],
  content: PublicApiContentMap,
  behavior: PublicApiBehaviorMap,
  presentation: PublicApiPresentationMap,
): PublicApiReference {
  const errors = [
    ...validatePublicApiContent(entries, content, behavior),
    ...validatePublicApiPresentation(entries, presentation),
  ]

  if (errors.length > 0) {
    throw new Error(
      [
        'Public API reference validation failed:',
        ...errors.map((error) => `- ${error}`),
      ].join('\n'),
    )
  }

  const reference: Record<PublicApiSectionId, PublicApiReferenceItem[]> = {
    composition: [],
    primitives: [],
    'convenience-api': [],
    'public-types': [],
  }

  for (const entry of entries) {
    const entryPresentation = presentation[entry.id]!
    reference[entryPresentation.section].push({
      entry,
      content: content[entry.id]!,
      presentation: entryPresentation,
    })
  }

  return reference
}
