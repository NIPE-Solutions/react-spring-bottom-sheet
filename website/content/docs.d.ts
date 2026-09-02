export interface DocSection {
  title: string
  body: string
  code?: string
}

export interface DocPage {
  slug: string
  title: string
  description: string
  sections: DocSection[]
}

export const docs: DocPage[]
export function getDoc(slug: string): DocPage | undefined
