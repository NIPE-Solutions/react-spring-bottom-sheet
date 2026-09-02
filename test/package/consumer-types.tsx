import { createRef } from 'react'
import type {
  BottomSheetProps,
  OpenChangeDetails,
  OpenChangeReason,
  SheetBackdropProps,
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetHandleProps,
  SheetPortalProps,
  SheetRootProps,
  SheetTitleProps,
  SheetTriggerProps,
  SheetViewportProps,
  SnapPoint,
  SnapPointValue,
} from '@nipe-solutions/react-spring-bottom-sheet'
import { BottomSheet, Sheet } from '@nipe-solutions/react-spring-bottom-sheet'

const reasons: readonly OpenChangeReason[] = [
  'trigger',
  'close',
  'escape',
  'backdrop',
  'drag',
  'imperative',
]
const snapValues: readonly SnapPointValue[] = [240, '240px', '50%', 'content']
const snapPoints: readonly SnapPoint[] = snapValues.map((value, index) => ({
  id: String(index),
  value,
}))

const controlledRootProps: SheetRootProps = {
  children: null,
  open: true,
  activeSnapPoint: '2',
  snapPoints,
  onOpenChange(open, details: OpenChangeDetails) {
    const nextOpen: boolean = open
    const reason: OpenChangeReason = details.reason
    void nextOpen
    void reason
  },
  onSnapPointChange(id) {
    const snapPointId: string = id
    void snapPointId
  },
}
const uncontrolledRootProps: SheetRootProps = {
  children: null,
  defaultOpen: true,
  defaultSnapPoint: '0',
  dismissible: true,
  modal: true,
  snapPoints,
}

const triggerProps: SheetTriggerProps = { disabled: false, type: 'button' }
const closeProps: SheetCloseProps = { type: 'submit' }
const backdropProps: SheetBackdropProps = { 'aria-hidden': true }
const viewportProps: SheetViewportProps = { className: 'viewport' }
const contentProps: SheetContentProps = { 'aria-label': 'Actions' }
const handleProps: SheetHandleProps = { role: 'presentation' }
const titleProps: SheetTitleProps = { id: 'title' }
const descriptionProps: SheetDescriptionProps = { id: 'description' }
const portalProps: SheetPortalProps = {
  children: null,
  container: document.createDocumentFragment(),
}
const bottomSheetProps: BottomSheetProps = {
  children: 'Content',
  title: 'Title',
  description: 'Description',
  defaultOpen: true,
  snapPoints,
  contentProps,
}

void controlledRootProps
void uncontrolledRootProps
void triggerProps
void closeProps
void backdropProps
void viewportProps
void contentProps
void handleProps
void titleProps
void descriptionProps
void portalProps
void bottomSheetProps
void reasons

const rootRef = createRef<HTMLDivElement>()
const triggerRef = createRef<HTMLButtonElement>()
const closeRef = createRef<HTMLButtonElement>()
const titleRef = createRef<HTMLHeadingElement>()
const descriptionRef = createRef<HTMLParagraphElement>()
const divRef = createRef<HTMLDivElement>()

export const primitives = (
  <Sheet.Root {...controlledRootProps}>
    <Sheet.Trigger {...triggerProps} ref={triggerRef} asChild>
      <button type="button">Open</button>
    </Sheet.Trigger>
    <Sheet.Portal {...portalProps}>
      <Sheet.Backdrop {...backdropProps} ref={divRef} asChild>
        <aside />
      </Sheet.Backdrop>
      <Sheet.Viewport {...viewportProps} ref={divRef} asChild>
        <main>
          <Sheet.Content {...contentProps} ref={divRef} asChild>
            <section>
              <Sheet.Handle {...handleProps} ref={divRef} asChild>
                <span />
              </Sheet.Handle>
              <Sheet.Title {...titleProps} ref={titleRef} asChild>
                <h1>Title</h1>
              </Sheet.Title>
              <Sheet.Description
                {...descriptionProps}
                ref={descriptionRef}
                asChild
              >
                <div>Description</div>
              </Sheet.Description>
              <Sheet.Close {...closeProps} ref={closeRef} asChild>
                <button type="button">Close</button>
              </Sheet.Close>
            </section>
          </Sheet.Content>
        </main>
      </Sheet.Viewport>
    </Sheet.Portal>
  </Sheet.Root>
)

export const uncontrolled = <Sheet.Root {...uncontrolledRootProps} />

export const convenience = <BottomSheet {...bottomSheetProps} />

// @ts-expect-error Snap point strings require px, %, or content.
const invalidSnapValue: SnapPointValue = '320'
// @ts-expect-error Every snap point requires a stable id.
const invalidSnapPoint: SnapPoint = { value: 240 }
// @ts-expect-error Change reasons are a closed union.
const invalidReason: OpenChangeReason = 'programmatic'
const invalidRootCallback: SheetRootProps = {
  children: null,
  // @ts-expect-error Root callbacks receive a boolean and details object.
  onOpenChange(value: string) {
    void value
  },
}
const invalidTriggerRef = (
  // @ts-expect-error Trigger refs resolve to buttons.
  <Sheet.Trigger ref={rootRef}>Open</Sheet.Trigger>
)
const removedLifecycle = (
  // @ts-expect-error Removed v4 lifecycle props are not supported.
  <BottomSheet title="Title" onSpringStart={() => {}}>
    Content
  </BottomSheet>
)
const invalidBottomSheet = (
  // @ts-expect-error BottomSheet requires a title.
  <BottomSheet>Content</BottomSheet>
)

void invalidSnapValue
void invalidSnapPoint
void invalidReason
void invalidRootCallback
void invalidTriggerRef
void removedLifecycle
void invalidBottomSheet
