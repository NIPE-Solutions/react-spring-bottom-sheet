import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { extractPublicApi, serializePublicApi } from './extract-public-api.mjs'

const extractorPath = fileURLToPath(
  new URL('./extract-public-api.mjs', import.meta.url),
)

function writeFixture(files) {
  const projectRoot = mkdtempSync(join(tmpdir(), 'public-api-extractor-'))

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = join(projectRoot, relativePath)
    mkdirSync(join(filePath, '..'), { recursive: true })
    writeFileSync(filePath, contents)
  }

  return projectRoot
}

function removeFixture(projectRoot) {
  rmSync(projectRoot, { force: true, recursive: true })
}

function publicApiFixture() {
  return {
    'dist/index.d.ts': `
export { Sheet } from './components/Sheet.js'
export { BottomSheet } from './components/BottomSheet.js'
export type { BottomSheetProps } from './components/BottomSheet.js'
export type { SheetRootProps } from './components/Root.js'
export type { OpenChangeDetails, OpenChangeReason } from './public-types.js'
`,
    'dist/components/Sheet.d.ts': `
import { Backdrop } from './Backdrop.js'
import { Close } from './Close.js'
import { Content } from './Content.js'
import { Description } from './Description.js'
import { Handle } from './Handle.js'
import { Portal } from './Portal.js'
import { Root } from './Root.js'
import { Title } from './Title.js'
import { Trigger } from './Trigger.js'
import { Viewport } from './Viewport.js'

export declare const Sheet: {
  readonly Root: typeof Root
  readonly Trigger: typeof Trigger
  readonly Portal: typeof Portal
  readonly Backdrop: typeof Backdrop
  readonly Viewport: typeof Viewport
  readonly Content: typeof Content
  readonly Handle: typeof Handle
  readonly Title: typeof Title
  readonly Description: typeof Description
  readonly Close: typeof Close
}
`,
    'dist/components/BottomSheet.d.ts': `
import type { SheetRootProps } from './Root.js'

export interface BottomSheetProps extends SheetRootProps {
  snapPoints?: readonly number[]
}

export declare const BottomSheet: (props: BottomSheetProps) => string
`,
    'dist/components/Root.d.ts': `
export interface SheetRootProps {
  open: boolean
  modal?: boolean
}

export declare const Root: (props: SheetRootProps) => string
`,
    'dist/components/Backdrop.d.ts': `export declare const Backdrop: () => string\n`,
    'dist/components/Close.d.ts': `export declare const Close: () => string\n`,
    'dist/components/Content.d.ts': `export declare const Content: () => string\n`,
    'dist/components/Description.d.ts': `export declare const Description: () => string\n`,
    'dist/components/Handle.d.ts': `export declare const Handle: () => string\n`,
    'dist/components/Portal.d.ts': `export declare const Portal: () => string\n`,
    'dist/components/Title.d.ts': `export declare const Title: () => string\n`,
    'dist/components/Trigger.d.ts': `export declare const Trigger: () => string\n`,
    'dist/components/Viewport.d.ts': `export declare const Viewport: () => string\n`,
    'dist/public-types.d.ts': `
export type OpenChangeReason = 'trigger' | 'close'

export interface OpenChangeDetails {
  reason: OpenChangeReason
}
`,
    'src/components/Sheet.ts': '',
    'src/components/BottomSheet.tsx': '',
    'src/components/Root.tsx': '',
    'src/public-types.ts': '',
  }
}

function cliFixture() {
  return {
    'dist/index.d.ts':
      "export type { OpenChangeReason } from './public-types.js'\n",
    'dist/public-types.d.ts':
      "export type OpenChangeReason = 'open' | 'close'\n",
    'src/public-types.ts': '',
  }
}

function runExtractorCli(projectRoot, ...args) {
  return spawnSync(process.execPath, [extractorPath, ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
}

test('CLI writes a serialized manifest from a supplied declaration root', () => {
  const projectRoot = writeFixture(cliFixture())
  const declarationFile = join(projectRoot, 'dist/index.d.ts')
  const outputFile = join(projectRoot, 'website/generated/public-api.json')

  try {
    const result = runExtractorCli(
      projectRoot,
      '--declaration',
      declarationFile,
      '--write',
      outputFile,
    )

    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(outputFile), true)
    assert.equal(
      readFileSync(outputFile, 'utf8'),
      `[
  {
    "id": "open-change-reason",
    "name": "OpenChangeReason",
    "kind": "type",
    "signature": "'open' | 'close'",
    "source": "src/public-types.ts"
  }
]
`,
    )
    assert.deepEqual(
      readdirSync(dirname(outputFile)).filter((name) => name.endsWith('.tmp')),
      [],
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('CLI check rejects an outdated manifest from a supplied declaration root', () => {
  const projectRoot = writeFixture(cliFixture())
  const declarationFile = join(projectRoot, 'dist/index.d.ts')
  const outputFile = join(projectRoot, 'website/generated/public-api.json')
  mkdirSync(dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, 'outdated artifact\n')

  try {
    const result = runExtractorCli(
      projectRoot,
      '--declaration',
      declarationFile,
      '--check',
      outputFile,
    )

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Generated public API manifest is outdated/)
  } finally {
    removeFixture(projectRoot)
  }
})

test('CLI cleans up its temporary file when an atomic write fails', () => {
  const projectRoot = writeFixture(cliFixture())
  const declarationFile = join(projectRoot, 'dist/index.d.ts')
  const outputDirectory = join(projectRoot, 'website/generated/public-api.json')
  mkdirSync(outputDirectory, { recursive: true })

  try {
    const result = runExtractorCli(
      projectRoot,
      '--declaration',
      declarationFile,
      '--write',
      outputDirectory,
    )

    assert.notEqual(result.status, 0)
    assert.deepEqual(
      readdirSync(dirname(outputDirectory)).filter((name) =>
        name.endsWith('.tmp'),
      ),
      [],
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('extracts aliases, compound members, owned interface members, and unions', () => {
  const projectRoot = writeFixture(publicApiFixture())

  try {
    const entries = extractPublicApi({
      declarationFile: join(projectRoot, 'dist/index.d.ts'),
      projectRoot,
    })

    assert.deepEqual(entries, [
      {
        id: 'sheet',
        name: 'Sheet',
        kind: 'namespace',
        signature: 'Sheet',
        source: 'src/components/Sheet.ts',
        members: [
          {
            name: 'Root',
            signature: '(props: SheetRootProps) => string',
            required: true,
          },
          { name: 'Trigger', signature: '() => string', required: true },
          { name: 'Portal', signature: '() => string', required: true },
          { name: 'Backdrop', signature: '() => string', required: true },
          { name: 'Viewport', signature: '() => string', required: true },
          { name: 'Content', signature: '() => string', required: true },
          { name: 'Handle', signature: '() => string', required: true },
          { name: 'Title', signature: '() => string', required: true },
          { name: 'Description', signature: '() => string', required: true },
          { name: 'Close', signature: '() => string', required: true },
        ],
      },
      {
        id: 'bottom-sheet',
        name: 'BottomSheet',
        kind: 'component',
        signature: '(props: BottomSheetProps) => string',
        source: 'src/components/BottomSheet.tsx',
      },
      {
        id: 'bottom-sheet-props',
        name: 'BottomSheetProps',
        kind: 'type',
        signature: 'interface BottomSheetProps extends SheetRootProps',
        source: 'src/components/BottomSheet.tsx',
        members: [
          {
            name: 'snapPoints',
            signature: 'readonly number[]',
            required: false,
          },
          { name: 'open', signature: 'boolean', required: true },
          { name: 'modal', signature: 'boolean', required: false },
        ],
      },
      {
        id: 'sheet-root-props',
        name: 'SheetRootProps',
        kind: 'type',
        signature: 'interface SheetRootProps',
        source: 'src/components/Root.tsx',
        members: [
          { name: 'open', signature: 'boolean', required: true },
          { name: 'modal', signature: 'boolean', required: false },
        ],
      },
      {
        id: 'open-change-details',
        name: 'OpenChangeDetails',
        kind: 'type',
        signature: 'interface OpenChangeDetails',
        source: 'src/public-types.ts',
        members: [
          { name: 'reason', signature: 'OpenChangeReason', required: true },
        ],
      },
      {
        id: 'open-change-reason',
        name: 'OpenChangeReason',
        kind: 'type',
        signature: "'trigger' | 'close'",
        source: 'src/public-types.ts',
      },
    ])
  } finally {
    removeFixture(projectRoot)
  }
})

test('serializes deterministically with a trailing newline', () => {
  const projectRoot = writeFixture(publicApiFixture())

  try {
    const options = {
      declarationFile: join(projectRoot, 'dist/index.d.ts'),
      projectRoot,
    }

    const first = serializePublicApi(extractPublicApi(options))
    const second = serializePublicApi(extractPublicApi(options))

    assert.equal(first, second)
    assert.equal(first.endsWith('\n'), true)
    assert.equal(
      first,
      `${JSON.stringify(extractPublicApi(options), null, 2)}\n`,
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('rejects a missing declaration root', () => {
  const projectRoot = writeFixture({})

  try {
    assert.throws(
      () =>
        extractPublicApi({
          declarationFile: join(projectRoot, 'dist/index.d.ts'),
          projectRoot,
        }),
      /Declaration root not found: .*dist\/index\.d\.ts/,
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('rejects unsupported exported symbols', () => {
  const projectRoot = writeFixture({
    'dist/index.d.ts': 'export declare const unsupported: number\n',
  })

  try {
    assert.throws(
      () =>
        extractPublicApi({
          declarationFile: join(projectRoot, 'dist/index.d.ts'),
          projectRoot,
        }),
      /Unsupported public export "unsupported"/,
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('rejects duplicate normalized identifiers', () => {
  const projectRoot = writeFixture({
    'dist/index.d.ts': `
export declare const FooBar: () => string
export declare const fooBar: () => string
`,
  })

  try {
    assert.throws(
      () =>
        extractPublicApi({
          declarationFile: join(projectRoot, 'dist/index.d.ts'),
          projectRoot,
        }),
      /Duplicate normalized identifier "foo-bar" for "FooBar" and "fooBar"/,
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('rejects an incomplete Sheet namespace', () => {
  const fixture = publicApiFixture()
  fixture['dist/components/Sheet.d.ts'] = fixture[
    'dist/components/Sheet.d.ts'
  ].replace('  readonly Close: typeof Close\n', '')
  const projectRoot = writeFixture(fixture)

  try {
    assert.throws(
      () =>
        extractPublicApi({
          declarationFile: join(projectRoot, 'dist/index.d.ts'),
          projectRoot,
        }),
      /Sheet namespace is incomplete: missing Close/,
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('keeps dependency-owned inherited members out of public type rows', () => {
  const projectRoot = writeFixture({
    'dist/index.d.ts': `
export type { Props } from './Props.js'
`,
    'dist/Props.d.ts': `
import type { NativeAttributes } from 'react'

export interface Props extends NativeAttributes {
  own?: boolean
}
`,
    'node_modules/react/package.json':
      '{ "name": "react", "type": "module", "types": "index.d.ts" }\n',
    'node_modules/react/index.d.ts': `
export interface NativeAttributes {
  native?: string
}
`,
  })
  const resolvedProjectRoot = realpathSync(projectRoot)

  try {
    assert.deepEqual(
      extractPublicApi({
        declarationFile: join(resolvedProjectRoot, 'dist/index.d.ts'),
        projectRoot: resolvedProjectRoot,
      }),
      [
        {
          id: 'props',
          name: 'Props',
          kind: 'type',
          signature: 'interface Props extends NativeAttributes',
          source: 'dist/Props.d.ts',
          members: [{ name: 'own', signature: 'boolean', required: false }],
        },
      ],
    )
  } finally {
    removeFixture(projectRoot)
  }
})

test('uses lexical ordering for exports outside the package presentation order', () => {
  const projectRoot = writeFixture({
    'dist/index.d.ts': `
export declare const Zebra: () => string
export declare const Apple: () => string
`,
  })

  try {
    assert.deepEqual(
      extractPublicApi({
        declarationFile: join(projectRoot, 'dist/index.d.ts'),
        projectRoot,
      }).map((entry) => entry.name),
      ['Apple', 'Zebra'],
    )
  } finally {
    removeFixture(projectRoot)
  }
})
