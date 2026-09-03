import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'
import { useSheetContext } from '../context/sheet-context.js'

export type SheetCloseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

export const Close = forwardRef<HTMLButtonElement, SheetCloseProps>(
  function Close(
    {
      asChild = false,
      children,
      className,
      onClick,
      type = 'button',
      ...props
    },
    ref,
  ) {
    const { requestOpenChange } = useSheetContext('Sheet.Close')
    const shared = {
      ...props,
      className: ['rsbs-close', className].filter(Boolean).join(' '),
      'data-rsbs-close': '',
      onClick: (event: MouseEvent<HTMLElement>) => {
        onClick?.(event as MouseEvent<HTMLButtonElement>)
        if (!event.defaultPrevented) requestOpenChange(false, 'close')
      },
    }
    return asChild ? (
      <Slot {...shared} ref={ref as Ref<HTMLElement>}>
        {children as SlotProps['children']}
      </Slot>
    ) : (
      <button {...shared} ref={ref} type={type}>
        {children}
      </button>
    )
  },
)
