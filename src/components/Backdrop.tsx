import { forwardRef } from 'react'
import type { HTMLAttributes, MouseEvent, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'
import { useSheetContext } from '../context/sheet-context.js'

export type SheetBackdropProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean
}

export const Backdrop = forwardRef<HTMLDivElement, SheetBackdropProps>(
  function Backdrop(
    { asChild = false, children, className, onClick, ...props },
    ref,
  ) {
    const { dismissible, open, requestOpenChange } =
      useSheetContext('Sheet.Backdrop')
    const shared = {
      ...props,
      className: ['rsbs-backdrop', className].filter(Boolean).join(' '),
      'data-rsbs-backdrop': '',
      'data-rsbs-state': open ? 'open' : 'closed',
      onClick: (event: MouseEvent<HTMLElement>) => {
        onClick?.(event as MouseEvent<HTMLDivElement>)
        if (
          dismissible &&
          event.target === event.currentTarget &&
          !event.defaultPrevented
        )
          requestOpenChange(false, 'backdrop')
      },
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
