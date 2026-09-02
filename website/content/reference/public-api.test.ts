import { describe, expect, it } from 'vitest'
import generatedPublicApi from '../../generated/public-api.json'
import {
  publicApiContent,
  validatePublicApiContent,
  type PublicApiContentMap,
  type PublicApiEntry,
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
} as const

describe('validatePublicApiContent', () => {
  it('reports a generated entry without maintained content', () => {
    const incompleteContent = { sheet: completeContent.sheet }

    expect(
      validatePublicApiContent(generatedEntries, incompleteContent),
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

    expect(validatePublicApiContent(generatedEntries, content)).toEqual([
      'Missing content for public API member "Sheet.Trigger".',
    ])
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

    expect(validatePublicApiContent(generatedEntries, content)).toEqual([
      'Missing content for public API member "Sheet.Trigger".',
    ])
  })

  it('reports maintained entry content that is absent from generated data', () => {
    const content = {
      ...completeContent,
      legacy: { summary: 'No longer public.' },
    }

    expect(validatePublicApiContent(generatedEntries, content)).toEqual([
      'Unknown content for public API entry "legacy".',
    ])
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

    expect(validatePublicApiContent(generatedEntries, content)).toEqual([
      'Unknown content for public API member "Sheet.Legacy".',
    ])
  })

  it('accepts the maintained content for the generated public API', () => {
    expect(
      validatePublicApiContent(
        generatedPublicApi as readonly PublicApiEntry[],
        publicApiContent,
      ),
    ).toEqual([])
  })
})
