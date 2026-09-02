import type { ComponentType } from 'react'
import { ApiReference } from './behavior'

const guides: Readonly<Record<string, ComponentType>> = {
  api: ApiReference,
}

export function getReferenceGuide(slug: string): ComponentType | undefined {
  return guides[slug]
}

export { ApiReference }
