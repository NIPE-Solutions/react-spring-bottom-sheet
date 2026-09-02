import { forwardRef, useEffect, useRef } from 'react'
import type {
  CSSProperties,
  HTMLAttributes,
  PointerEventHandler,
  Ref,
} from 'react'
import { containTabFocus, focusInitialElement } from '../accessibility/focus.js'
import { isolateBackground } from '../accessibility/isolation.js'
import { mergeRefs } from '../composition/merge-refs.js'
import { Slot } from '../composition/Slot.js'
import type { SlotProps } from '../composition/Slot.js'
import { useSheetContext } from '../context/sheet-context.js'

export type SheetContentProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean
}

export const Content = forwardRef<HTMLDivElement, SheetContentProps>(
  function Content(
    {
      asChild = false,
      children,
      className,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      style,
      ...props
    },
    ref,
  ) {
    const {
      descriptionId,
      dismissible,
      modal,
      open,
      requestOpenChange,
      registerContent,
      interactionHandlers,
      position,
      dragging,
      titleId,
      transitionPhase,
    } = useSheetContext('Sheet.Content')
    const internalRef = useRef<HTMLElement>(null)

    useEffect(() => {
      const content = internalRef.current
      if (!content || !open) return
      const previouslyFocused =
        modal && document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      const restoreIsolation = modal ? isolateBackground(content) : undefined
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && dismissible) {
          event.preventDefault()
          requestOpenChange(false, 'escape')
        } else if (modal) {
          containTabFocus(event, content)
        }
      }
      const onFocusIn = (event: FocusEvent) => {
        if (
          modal &&
          event.target instanceof Node &&
          !content.contains(event.target)
        ) {
          focusInitialElement(content)
        }
      }

      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('focusin', onFocusIn)
      if (modal) focusInitialElement(content)
      return () => {
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('focusin', onFocusIn)
        restoreIsolation?.()
        previouslyFocused?.focus({ preventScroll: true })
      }
    }, [dismissible, modal, open, requestOpenChange])

    useEffect(() => {
      const content = internalRef.current
      if (process.env.NODE_ENV === 'production' || !content || !open) return
      let active = true
      queueMicrotask(() => {
        if (
          active &&
          content.isConnected &&
          !content.hasAttribute('aria-label') &&
          !content.getAttribute('aria-labelledby')
        ) {
          console.warn('Sheet.Content requires Sheet.Title or an aria-label.')
        }
      })
      return () => {
        active = false
      }
    }, [open, titleId])

    const classes = ['rsbs-content', className].filter(Boolean).join(' ')
    const composePointerHandler =
      (
        consumer: PointerEventHandler<HTMLElement> | undefined,
        internal: PointerEventHandler<HTMLElement>,
      ): PointerEventHandler<HTMLElement> =>
      (event) => {
        consumer?.(event)
        if (!event.defaultPrevented) internal(event)
      }
    const positionStyle = {
      ...style,
      '--rsbs-position': `${position}px`,
    } as CSSProperties
    const shared = {
      ...props,
      role: 'dialog',
      tabIndex: props.tabIndex ?? -1,
      inert: !open,
      'aria-modal': modal || undefined,
      'aria-hidden': !open || undefined,
      'aria-labelledby': props['aria-label'] ? undefined : titleId,
      'aria-describedby': descriptionId,
      className: classes,
      'data-rsbs-content': '',
      'data-rsbs-state': transitionPhase,
      'data-rsbs-dragging': dragging || undefined,
      onPointerDown: composePointerHandler(
        onPointerDown,
        interactionHandlers.onPointerDown,
      ),
      onPointerMove: composePointerHandler(
        onPointerMove,
        interactionHandlers.onPointerMove,
      ),
      onPointerUp: composePointerHandler(
        onPointerUp,
        interactionHandlers.onPointerUp,
      ),
      onPointerCancel: composePointerHandler(
        onPointerCancel,
        interactionHandlers.onPointerCancel,
      ),
      style: positionStyle,
    }
    return asChild ? (
      <Slot
        {...shared}
        ref={mergeRefs(internalRef, registerContent, ref as Ref<HTMLElement>)}
      >
        {children as SlotProps['children']}
      </Slot>
    ) : (
      <div
        {...shared}
        ref={mergeRefs(ref, (value) => {
          internalRef.current = value
          registerContent(value)
        })}
      >
        {children}
      </div>
    )
  },
)
