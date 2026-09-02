import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSheetContext } from '../context/sheet-context.js'

export interface SheetPortalProps {
  children: ReactNode
  container?: Element | DocumentFragment | null
}

export function Portal({ children, container }: SheetPortalProps) {
  const { present } = useSheetContext('Sheet.Portal')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !present) return null
  return createPortal(children, container ?? document.body)
}
