import type { CodeLanguage } from '../components/source-code/highlighter'

export type DocGroupId = 'learn' | 'reference' | 'project'

export interface DocSection {
  id: string
  title: string
  body: string
  code?: {
    source: string
    language: CodeLanguage
    lineNumbers?: boolean
  }
  link?: {
    href: string
    label: string
  }
}

export interface DocPageMeta {
  slug: string
  title: string
  description: string
  group: DocGroupId
  order: number
}

export interface DocPage extends DocPageMeta {
  sections: readonly DocSection[]
}

export interface DocHeading {
  id: string
  label: string
  depth: 2 | 3
}

export interface DocGroup {
  id: DocGroupId
  label: string
}
