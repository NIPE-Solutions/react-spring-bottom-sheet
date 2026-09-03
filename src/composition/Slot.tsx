import { Children, cloneElement, forwardRef, isValidElement } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  MouseEventHandler,
  PointerEventHandler,
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
  {
    children,
    className,
    onClick,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    style,
    ...props
  },
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
  const mergePointerHandler =
    (
      childHandler: PointerEventHandler<HTMLElement> | undefined,
      slotHandler: PointerEventHandler<HTMLElement> | undefined,
    ): PointerEventHandler<HTMLElement> =>
    (event) => {
      childHandler?.(event)
      if (!event.defaultPrevented) slotHandler?.(event)
    }
  const mergedStyle: CSSProperties = { ...style, ...child.props.style }

  return cloneElement(child, {
    ...props,
    ...child.props,
    className:
      [className, child.props.className].filter(Boolean).join(' ') || undefined,
    onClick: mergedClick,
    onPointerCancel: mergePointerHandler(
      child.props.onPointerCancel,
      onPointerCancel,
    ),
    onPointerDown: mergePointerHandler(
      child.props.onPointerDown,
      onPointerDown,
    ),
    onPointerMove: mergePointerHandler(
      child.props.onPointerMove,
      onPointerMove,
    ),
    onPointerUp: mergePointerHandler(child.props.onPointerUp, onPointerUp),
    ref: mergeRefs(forwardedRef, child.props.ref),
    style: mergedStyle,
  })
})
