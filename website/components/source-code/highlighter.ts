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

const foreground = '#F3F4FB'

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
  ],
} satisfies ThemeRegistration

const highlighterPromise = createHighlighter({
  engine: createJavaScriptRegexEngine(),
  langs: [langTsx],
  themes: [recipeSourceTheme],
})

export async function highlightTsx(source: string): Promise<HighlightedLine[]> {
  const highlighter = await highlighterPromise
  const { tokens } = highlighter.codeToTokens(source, {
    lang: 'tsx',
    theme: recipeSourceTheme.name,
  })

  return tokens.map((line) =>
    line.map(({ color = foreground, content, fontStyle }) => ({
      color,
      content,
      ...(fontStyle === undefined ? {} : { fontStyle }),
    })),
  )
}
