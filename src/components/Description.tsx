import { forwardRef, useEffect, useId } from 'react'
import type { HTMLAttributes, Ref } from 'react'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'
import { useSheetContext } from '../context/sheet-context.js'

export type SheetDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
  asChild?: boolean
}

export const Description = forwardRef<
  HTMLParagraphElement,
  SheetDescriptionProps
>(function Description(
  { asChild = false, children, className, id: providedId, ...props },
  ref,
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const { registerDescription } = useSheetContext('Sheet.Description')
  useEffect(() => registerDescription(id), [id, registerDescription])
  const shared = {
    ...props,
    id,
    className: ['rsbs-description', className].filter(Boolean).join(' '),
    'data-rsbs-description': '',
  }
  return asChild ? (
    <Slot {...shared} ref={ref as Ref<HTMLElement>}>
      {children as SlotProps['children']}
    </Slot>
  ) : (
    <p {...shared} ref={ref}>
      {children}
    </p>
  )
})
