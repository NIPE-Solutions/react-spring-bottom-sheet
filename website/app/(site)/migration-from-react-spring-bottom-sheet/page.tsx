import type { Metadata } from 'next'
import { CodeBlock } from '../../../components/source-code/CodeBlock'
import { MigrationPageContent } from '../../../content/migration'

export const metadata: Metadata = {
  title: 'Migrate react-spring-bottom-sheet to React 19',
  description:
    'Move from the original react-spring-bottom-sheet to an independently maintained React 19 implementation with an explicit API and styling migration path.',
  alternates: {
    canonical: '/migration-from-react-spring-bottom-sheet/',
  },
  openGraph: {
    title: 'Migrate react-spring-bottom-sheet to React 19',
    description:
      'Move from the original react-spring-bottom-sheet to an independently maintained React 19 implementation with an explicit API and styling migration path.',
    url: '/migration-from-react-spring-bottom-sheet/',
    type: 'website',
  },
  twitter: {
    title: 'Migrate react-spring-bottom-sheet to React 19',
    description:
      'Move from the original react-spring-bottom-sheet to an independently maintained React 19 implementation with an explicit API and styling migration path.',
  },
}

const installationCommand =
  'npm install @nipe-solutions/react-spring-bottom-sheet\n'

const originalExample = `import { useState } from 'react'
import { BottomSheet } from 'react-spring-bottom-sheet'

export function Details() {
  const [open, setOpen] = useState(false)

  return (
    <BottomSheet open={open} onDismiss={() => setOpen(false)}>
      <h2>Details</h2>
    </BottomSheet>
  )
}
`

const continuationExample = `import { useState } from 'react'
import { Sheet } from '@nipe-solutions/react-spring-bottom-sheet'

export function Details() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet.Root open={open} onOpenChange={setOpen}>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Title>Details</Sheet.Title>
            <Sheet.Close>Close</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
`

export default async function MigrationPage() {
  const [installCommand, beforeExample, afterExample] = await Promise.all([
    CodeBlock({
      source: installationCommand,
      language: 'shell',
      label: 'Installation command',
    }),
    CodeBlock({
      source: originalExample,
      language: 'tsx',
      filename: 'Before.tsx',
      lineNumbers: true,
    }),
    CodeBlock({
      source: continuationExample,
      language: 'tsx',
      filename: 'After.tsx',
      lineNumbers: true,
    }),
  ])

  return (
    <MigrationPageContent
      installCommand={installCommand}
      beforeExample={beforeExample}
      afterExample={afterExample}
    />
  )
}
