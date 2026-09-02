import { describe, expect, it } from 'vitest'
import generatedPublicApi from '../../generated/public-api.json'
import {
  createPublicApiReference,
  publicApiBehavior,
  publicApiContent,
  publicApiPresentation,
  validatePublicApiContent,
  type PublicApiBehaviorMap,
  type PublicApiContentMap,
  type PublicApiEntry,
  type PublicApiPresentationMap,
} from './public-api'

const generatedEntries = [
  {
    id: 'sheet',
    name: 'Sheet',
    kind: 'namespace',
    signature: 'Sheet',
    source: 'src/components/Sheet.ts',
    members: [
      {
        name: 'Root',
        signature: '(props: SheetRootProps) => JSX.Element',
        required: true,
      },
      {
        name: 'Trigger',
        signature: 'ForwardRefExoticComponent<SheetTriggerProps>',
        required: true,
      },
    ],
  },
  {
    id: 'bottom-sheet',
    name: 'BottomSheet',
    kind: 'component',
    signature: '(props: BottomSheetProps) => JSX.Element',
    source: 'src/components/BottomSheet.tsx',
  },
  {
    id: 'sheet-root-props',
    name: 'SheetRootProps',
    kind: 'type',
    signature: 'interface SheetRootProps',
    source: 'src/components/Root.tsx',
    members: [
      { name: 'open', signature: 'boolean', required: false },
      {
        name: 'snapPoints',
        signature: 'readonly SnapPoint[]',
        required: false,
      },
      { name: 'modal', signature: 'boolean', required: false },
      { name: 'dismissible', signature: 'boolean', required: false },
    ],
  },
] as const

const completeContent = {
  sheet: {
    summary: 'Compound components for composing a sheet.',
    members: {
      Root: { description: 'Owns sheet state and behavior.' },
      Trigger: { description: 'Requests that the sheet open.' },
    },
  },
  'bottom-sheet': {
    summary: 'Convenience composition for the standard sheet anatomy.',
  },
  'sheet-root-props': {
    summary: 'State and behavior props for Sheet.Root.',
    members: {
      open: {
        description: 'The controlled open state.',
        defaultValue: 'false',
      },
      snapPoints: {
        description: 'The available snap points.',
        defaultValue: 'content',
      },
      modal: { description: 'Enables modal behavior.', defaultValue: 'true' },
      dismissible: {
        description: 'Enables passive dismissal.',
        defaultValue: 'true',
      },
    },
  },
} as const

const completeBehavior = {
  'controlled-state': 'Controlled values remain authoritative.',
  dismissal: 'Dismissal requests identify their reason.',
  focus: 'Modal focus remains contained and restores on close.',
  portals: 'Portal content remains mounted while closing.',
  'reduced-motion': 'Reduced motion settles transitions immediately.',
} as const

const completePresentation = {
  sheet: { section: 'primitives', title: 'Sheet' },
  'bottom-sheet': { section: 'convenience-api', title: 'BottomSheet' },
  'sheet-root-props': { section: 'composition', title: 'Sheet.Root' },
} as const satisfies PublicApiPresentationMap

describe('validatePublicApiContent', () => {
  it('reports a generated entry without maintained content', () => {
    const incompleteContent = {
      sheet: completeContent.sheet,
      'sheet-root-props': completeContent['sheet-root-props'],
    }

    expect(
      validatePublicApiContent(
        generatedEntries,
        incompleteContent,
        completeBehavior,
      ),
    ).toEqual([
      'Missing content for public API entry "BottomSheet" (bottom-sheet).',
    ])
  })

  it('reports a generated member without a maintained description', () => {
    const content = {
      ...completeContent,
      sheet: {
        ...completeContent.sheet,
        members: {
          Root: completeContent.sheet.members.Root,
        },
      },
    }

    expect(
      validatePublicApiContent(generatedEntries, content, completeBehavior),
    ).toEqual(['Missing content for public API member "Sheet.Trigger".'])
  })

  it('reports a maintained member record whose description is absent', () => {
    const content = {
      ...completeContent,
      sheet: {
        ...completeContent.sheet,
        members: {
          ...completeContent.sheet.members,
          Trigger: {},
        },
      },
    } as unknown as PublicApiContentMap

    expect(
      validatePublicApiContent(generatedEntries, content, completeBehavior),
    ).toEqual(['Missing content for public API member "Sheet.Trigger".'])
  })

  it('reports maintained entry content that is absent from generated data', () => {
    const content = {
      ...completeContent,
      legacy: { summary: 'No longer public.' },
    }

    expect(
      validatePublicApiContent(generatedEntries, content, completeBehavior),
    ).toEqual(['Unknown content for public API entry "legacy".'])
  })

  it('reports a maintained member that is absent from generated data', () => {
    const content = {
      ...completeContent,
      sheet: {
        ...completeContent.sheet,
        members: {
          ...completeContent.sheet.members,
          Legacy: { description: 'No longer public.' },
        },
      },
    }

    expect(
      validatePublicApiContent(generatedEntries, content, completeBehavior),
    ).toEqual(['Unknown content for public API member "Sheet.Legacy".'])
  })

  it('reports an empty maintained summary', () => {
    const content = {
      ...completeContent,
      'bottom-sheet': { summary: '   ' },
    }

    expect(
      validatePublicApiContent(generatedEntries, content, completeBehavior),
    ).toEqual([
      'Missing summary for public API entry "BottomSheet" (bottom-sheet).',
    ])
  })

  it.each(['open', 'snapPoints', 'modal', 'dismissible'] as const)(
    'reports a missing %s runtime default',
    (memberName) => {
      const rootContent = completeContent['sheet-root-props']
      const content = {
        ...completeContent,
        'sheet-root-props': {
          ...rootContent,
          members: {
            ...rootContent.members,
            [memberName]: {
              description: rootContent.members[memberName].description,
            },
          },
        },
      }

      expect(
        validatePublicApiContent(generatedEntries, content, completeBehavior),
      ).toEqual([
        `Missing default for public API member "SheetRootProps.${memberName}".`,
      ])
    },
  )

  it.each([
    'controlled-state',
    'dismissal',
    'focus',
    'portals',
    'reduced-motion',
  ] as const)('reports missing %s behavioral guidance', (behaviorKey) => {
    const behavior = {
      ...completeBehavior,
      [behaviorKey]: '   ',
    } as PublicApiBehaviorMap

    expect(
      validatePublicApiContent(generatedEntries, completeContent, behavior),
    ).toEqual([`Missing behavioral guidance for "${behaviorKey}".`])
  })

  it('accepts the maintained content for the generated public API', () => {
    expect(
      validatePublicApiContent(
        generatedPublicApi as readonly PublicApiEntry[],
        publicApiContent,
        publicApiBehavior,
      ),
    ).toEqual([])
  })
})

describe('createPublicApiReference', () => {
  it('aggregates editorial and presentation errors before rendering', () => {
    const content = {
      ...completeContent,
      'bottom-sheet': { summary: '   ' },
    }
    const behavior = {
      ...completeBehavior,
      focus: '   ',
    }
    const presentation = {
      sheet: completePresentation.sheet,
      'bottom-sheet': completePresentation['bottom-sheet'],
      legacy: { section: 'public-types', title: 'Legacy' },
    } as PublicApiPresentationMap

    expect(() =>
      createPublicApiReference(
        generatedEntries,
        content,
        behavior,
        presentation,
      ),
    ).toThrowError(
      [
        'Public API reference validation failed:',
        '- Missing summary for public API entry "BottomSheet" (bottom-sheet).',
        '- Missing behavioral guidance for "focus".',
        '- Missing presentation for public API entry "SheetRootProps" (sheet-root-props).',
        '- Unknown presentation for public API entry "legacy".',
      ].join('\n'),
    )
  })

  it('groups every generated entry exactly once', () => {
    const reference = createPublicApiReference(
      generatedPublicApi as readonly PublicApiEntry[],
      publicApiContent,
      publicApiBehavior,
      publicApiPresentation,
    )
    const renderedIds = Object.values(reference).flatMap((items) =>
      items.map(({ entry }) => entry.id),
    )
    const generatedIds = generatedPublicApi.map(({ id }) => id)

    expect(renderedIds).toHaveLength(generatedIds.length)
    expect(new Set(renderedIds).size).toBe(generatedIds.length)
    expect(renderedIds.toSorted()).toEqual(generatedIds.toSorted())
  })
})
