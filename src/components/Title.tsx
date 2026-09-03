import { forwardRef, useEffect, useId } from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'
import { useSheetContext } from '../context/sheet-context.js'

export type SheetTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  asChild?: boolean
}

export const Title = forwardRef<HTMLHeadingElement, SheetTitleProps>(
  function Title(
    { asChild = false, children, className, id: providedId, ...props },
    ref,
  ) {
    const generatedId = useId()
    const id = providedId ?? generatedId
    const { registerTitle } = useSheetContext('Sheet.Title')
    useEffect(() => registerTitle(id), [id, registerTitle])
    const shared = {
      ...props,
      id,
      className: ['rsbs-title', className].filter(Boolean).join(' '),
      'data-rsbs-title': '',
    }
    return asChild ? (
      <Slot {...shared} ref={ref as Ref<HTMLElement>}>
        {children as SlotProps['children']}
      </Slot>
    ) : (
      <h2 {...shared} ref={ref}>
        {children}
      </h2>
    )
  },
)
