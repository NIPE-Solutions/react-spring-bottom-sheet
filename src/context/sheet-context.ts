import { createContext, useContext } from 'react'
import type { PointerEventHandler } from 'react'
import type { TransitionPhase } from '../controller/types.js'
import type { OpenChangeReason } from '../public-types.js'

export interface SheetContextValue {
  open: boolean
  present: boolean
  transitionPhase: TransitionPhase
  modal: boolean
  dismissible: boolean
  titleId: string | undefined
  descriptionId: string | undefined
  requestOpenChange(open: boolean, reason: OpenChangeReason): void
  registerTitle(id: string): () => void
  registerDescription(id: string): () => void
  registerViewport(element: HTMLElement | null): void
  registerContent(element: HTMLElement | null): void
  registerBackdrop(element: HTMLElement | null): void
  interactionHandlers: {
    onPointerDown: PointerEventHandler<HTMLElement>
    onPointerMove: PointerEventHandler<HTMLElement>
    onPointerUp: PointerEventHandler<HTMLElement>
    onPointerCancel: PointerEventHandler<HTMLElement>
  }
  position: number
  surfaceProgress: number
  dragging: boolean
}

export const SheetContext = createContext<SheetContextValue | null>(null)

export function useSheetContext(component: string): SheetContextValue {
  const context = useContext(SheetContext)
  if (!context) throw new Error(`${component} must be used inside Sheet.Root`)
  return context
}
