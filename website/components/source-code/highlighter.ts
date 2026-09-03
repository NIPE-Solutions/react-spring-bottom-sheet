import langCss from '@shikijs/langs/css'
import langShell from '@shikijs/langs/shell'
import langTsx from '@shikijs/langs/tsx'
import {
  createHighlighterCore as createHighlighter,
  type ThemeRegistration,
} from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export type HighlightedToken = {
  content: string
  color: string
  fontStyle?: number
}

export type HighlightedLine = readonly HighlightedToken[]

export type CodeLanguage = 'tsx' | 'css' | 'shell'

const foreground = '#F3F4FB'
const shellPackageForeground = '#F3A6C8'

const recipeSourceTheme = {
  name: 'docs-recipe-source',
  type: 'dark',
  colors: {
    'editor.background': '#181A25',
    'editor.foreground': foreground,
  },
  settings: [
    {
      settings: {
        background: '#181A25',
        foreground,
      },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#B9C0CF', fontStyle: 'italic' },
    },
    {
      scope: ['string', 'punctuation.definition.string'],
      settings: { foreground: '#AFC6FF' },
    },
    {
      scope: ['constant', 'variable.other.constant'],
      settings: { foreground: '#F4C67A' },
    },
    {
      scope: ['keyword', 'storage.modifier'],
      settings: { foreground: '#8DA4FF' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'variable.function'],
      settings: { foreground: '#82D2B5' },
    },
    {
      scope: ['entity.name.type', 'support.type', 'storage.type'],
      settings: { foreground: '#C8B6FF' },
    },
    {
      scope: ['punctuation', 'meta.brace'],
      settings: { foreground: '#D7DBE5' },
    },
    {
      scope: ['entity.name.tag', 'entity.name.tag.jsx'],
      settings: { foreground: '#F3A6C8' },
    },
    {
      scope: ['entity.other.attribute-name', 'entity.other.attribute-name.jsx'],
      settings: { foreground: '#F4C67A' },
    },
    {
      scope: [
        'support.type.property-name.css',
        'meta.property-name.css',
        'entity.other.attribute-name.css',
      ],
      settings: { foreground: '#82D2B5' },
    },
    {
      scope: [
        'support.constant.property-value.css',
        'support.constant.color.w3c-standard-color-name.css',
        'support.function.misc.css',
        'variable.argument.css',
      ],
      settings: { foreground: '#AFC6FF' },
    },
    {
      scope: ['entity.name.function.shell', 'support.function.shell'],
      settings: { foreground: '#82D2B5' },
    },
    {
      scope: ['variable.parameter.option.shell', 'variable.parameter.shell'],
      settings: { foreground: '#F4C67A' },
    },
    {
      scope: ['meta.argument.shell'],
      settings: { foreground: '#C8B6FF' },
    },
  ],
} satisfies ThemeRegistration

const highlighterPromise = createHighlighter({
  engine: createJavaScriptRegexEngine(),
  langs: [langTsx, langCss, langShell],
  themes: [recipeSourceTheme],
})

function normalizeTokens(
  tokens: ReadonlyArray<
    ReadonlyArray<{
      color?: string
      content: string
      fontStyle?: number
    }>
  >,
  language: CodeLanguage,
  crlfLineIndexes: ReadonlySet<number>,
): HighlightedLine[] {
  return tokens.map((line, lineIndex) => {
    const normalizedLine = line.map(
      ({ color = foreground, content, fontStyle }) => ({
        color:
          language === 'shell' && content.startsWith('@')
            ? shellPackageForeground
            : color,
        content,
        ...(fontStyle === undefined ? {} : { fontStyle }),
      }),
    )

    // Shiki separates lines on LF and omits the preceding CR. Keep that CR in
    // its token line so CodeTokens' literal LF node recreates the original CRLF.
    return crlfLineIndexes.has(lineIndex)
      ? [...normalizedLine, { color: foreground, content: '\r' }]
      : normalizedLine
  })
}

export async function highlightCode(
  source: string,
  language: CodeLanguage,
): Promise<HighlightedLine[]> {
  const highlighter = await highlighterPromise
  const { tokens } = highlighter.codeToTokens(source, {
    lang: language,
    theme: recipeSourceTheme.name,
  })

  const crlfLineIndexes = new Set<number>()
  let lineIndex = 0
  for (let sourceIndex = 0; sourceIndex < source.length; sourceIndex += 1) {
    if (source[sourceIndex] !== '\n') continue
    if (source[sourceIndex - 1] === '\r') crlfLineIndexes.add(lineIndex)
    lineIndex += 1
  }

  return normalizeTokens(tokens, language, crlfLineIndexes)
}
