import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SheetContext } from '../context/sheet-context.js'
import type {
  OpenChangeDetails,
  OpenChangeReason,
  SnapPoint,
} from '../public-types.js'

export interface SheetRootProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void
  snapPoints?: readonly SnapPoint[]
  activeSnapPoint?: string
  defaultSnapPoint?: string
  onSnapPointChange?: (id: string) => void
  modal?: boolean
  dismissible?: boolean
}

export function Root({
  children,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  modal = true,
  dismissible = true,
}: SheetRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const [titleId, setTitleId] = useState<string>()
  const [descriptionId, setDescriptionId] = useState<string>()
  const open = controlledOpen ?? uncontrolledOpen
  const controlled = controlledOpen !== undefined

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      controlledOpen !== undefined &&
      defaultOpen !== undefined
    ) {
      console.warn(
        'Sheet.Root cannot use both open and defaultOpen; open takes precedence.',
      )
    }
  }, [controlledOpen, defaultOpen])

  const requestOpenChange = useCallback(
    (nextOpen: boolean, reason: OpenChangeReason) => {
      if (nextOpen === open) return
      if (!controlled) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen, { reason })
    },
    [controlled, onOpenChange, open],
  )

  const registerTitle = useCallback((id: string) => {
    setTitleId(id)
    return () => setTitleId((current) => (current === id ? undefined : current))
  }, [])

  const registerDescription = useCallback((id: string) => {
    setDescriptionId(id)
    return () =>
      setDescriptionId((current) => (current === id ? undefined : current))
  }, [])

  const value = useMemo(
    () => ({
      open,
      modal,
      dismissible,
      titleId,
      descriptionId,
      requestOpenChange,
      registerTitle,
      registerDescription,
    }),
    [
      descriptionId,
      dismissible,
      modal,
      open,
      registerDescription,
      registerTitle,
      requestOpenChange,
      titleId,
    ],
  )

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
}
