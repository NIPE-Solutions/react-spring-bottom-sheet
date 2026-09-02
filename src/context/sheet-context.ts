import { createContext, useContext } from 'react'
import type { OpenChangeReason } from '../public-types.js'

export interface SheetContextValue {
  open: boolean
  modal: boolean
  dismissible: boolean
  titleId: string | undefined
  descriptionId: string | undefined
  requestOpenChange(open: boolean, reason: OpenChangeReason): void
  registerTitle(id: string): () => void
  registerDescription(id: string): () => void
}

export const SheetContext = createContext<SheetContextValue | null>(null)

export function useSheetContext(component: string): SheetContextValue {
  const context = useContext(SheetContext)
  if (!context) throw new Error(`${component} must be used inside Sheet.Root`)
  return context
}
