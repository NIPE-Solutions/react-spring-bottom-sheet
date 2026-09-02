import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiTable } from '../../components/ApiTable'
import type { PublicApiContent, PublicApiEntry } from './public-api'

describe('ApiTable', () => {
  it('rejects an empty maintained summary', () => {
    const entry: PublicApiEntry = {
      id: 'widget',
      name: 'Widget',
      kind: 'component',
      signature: '(props: WidgetProps) => ReactNode',
      source: 'src/Widget.tsx',
    }
    const content: PublicApiContent = { summary: '   ' }

    expect(() => render(<ApiTable entry={entry} content={content} />)).toThrow(
      'Missing maintained public API summary for "Widget".',
    )
  })

  it('rejects a generated member without maintained prose', () => {
    const entry: PublicApiEntry = {
      id: 'options',
      name: 'Options',
      kind: 'type',
      signature: 'interface Options',
      source: 'src/options.ts',
      members: [{ name: 'enabled', signature: 'boolean', required: false }],
    }
    const content = {
      summary: 'Options for the component.',
      members: {},
    } as PublicApiContent

    expect(() => render(<ApiTable entry={entry} content={content} />)).toThrow(
      'Missing maintained public API content for "Options.enabled".',
    )
  })
})
