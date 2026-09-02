import { Children, cloneElement, forwardRef, isValidElement } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  MouseEventHandler,
  ReactElement,
  Ref,
} from 'react'
import { mergeRefs } from './merge-refs.js'

interface SlotChildProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>
}

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children: ReactElement<SlotChildProps>
}

export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, className, onClick, style, ...props },
  forwardedRef,
) {
  const child = Children.only(children)
  if (!isValidElement<SlotChildProps>(child)) {
    throw new Error('asChild requires exactly one valid element')
  }

  const childClick = child.props.onClick as
    MouseEventHandler<HTMLElement> | undefined
  const mergedClick: MouseEventHandler<HTMLElement> = (event) => {
    childClick?.(event)
    if (!event.defaultPrevented) onClick?.(event)
  }
  const mergedStyle: CSSProperties = { ...style, ...child.props.style }

  return cloneElement(child, {
    ...props,
    ...child.props,
    className:
      [className, child.props.className].filter(Boolean).join(' ') || undefined,
    onClick: mergedClick,
    ref: mergeRefs(forwardedRef, child.props.ref),
    style: mergedStyle,
  })
})
