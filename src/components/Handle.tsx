import { forwardRef } from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'

export type SheetHandleProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean
}

export const Handle = forwardRef<HTMLDivElement, SheetHandleProps>(
  function Handle({ asChild = false, children, className, ...props }, ref) {
    const shared = {
      ...props,
      className: ['rsbs-handle', className].filter(Boolean).join(' '),
      'data-rsbs-handle': '',
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
