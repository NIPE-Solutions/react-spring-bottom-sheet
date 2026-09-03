import { forwardRef, useMemo } from 'react'
import type { HTMLAttributes, MouseEvent, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'
import { mergeRefs } from '../composition/merge-refs.js'
import { useSheetContext } from '../context/sheet-context.js'

export type SheetBackdropProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean
}

export const Backdrop = forwardRef<HTMLDivElement, SheetBackdropProps>(
  function Backdrop(
    { asChild = false, children, className, onClick, ...props },
    ref,
  ) {
    const {
      dismissible,
      registerBackdrop,
      requestOpenChange,
      transitionPhase,
    } = useSheetContext('Sheet.Backdrop')
    const mergedRef = useMemo(
      () => mergeRefs(registerBackdrop, ref as Ref<HTMLElement>),
      [ref, registerBackdrop],
    )
    const shared = {
      ...props,
      className: ['rsbs-backdrop', className].filter(Boolean).join(' '),
      'data-rsbs-backdrop': '',
      'data-rsbs-state': transitionPhase,
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
      <Slot {...shared} ref={mergedRef}>
        {children as SlotProps['children']}
      </Slot>
    ) : (
      <div {...shared} ref={mergedRef as Ref<HTMLDivElement>}>
        {children}
      </div>
    )
  },
)
