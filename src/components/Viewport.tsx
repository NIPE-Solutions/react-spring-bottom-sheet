import { forwardRef } from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'

export type SheetViewportProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean
}

export const Viewport = forwardRef<HTMLDivElement, SheetViewportProps>(
  function Viewport({ asChild = false, children, className, ...props }, ref) {
    const shared = {
      ...props,
      className: ['rsbs-viewport', className].filter(Boolean).join(' '),
      'data-rsbs-viewport': '',
    }
    return asChild ? (
      <Slot {...shared} ref={ref as Ref<HTMLElement>}>
        {children as SlotProps['children']}
      </Slot>
    ) : (
      <div {...shared} ref={ref}>
        {children}
      </div>
    )
  },
)
