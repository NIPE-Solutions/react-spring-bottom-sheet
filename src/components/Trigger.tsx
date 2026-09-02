import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react'
import { useSheetContext } from '../context/sheet-context.js'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'

export interface SheetTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const Trigger = forwardRef<HTMLButtonElement, SheetTriggerProps>(
  function Trigger(
    { asChild = false, children, onClick, type = 'button', ...props },
    ref,
  ) {
    const { open, requestOpenChange } = useSheetContext('Sheet.Trigger')
    const sharedProps = {
      ...props,
      'aria-expanded': open,
      'data-rsbs-trigger': '',
      onClick: (event: MouseEvent<HTMLElement>) => {
        onClick?.(event as MouseEvent<HTMLButtonElement>)
        if (!event.defaultPrevented) requestOpenChange(true, 'trigger')
      },
    }

    return asChild ? (
      <Slot {...sharedProps} ref={ref as Ref<HTMLElement>}>
        {children as SlotProps['children']}
      </Slot>
    ) : (
      <button {...sharedProps} ref={ref} type={type}>
        {children}
      </button>
    )
  },
)
