import { createRef } from 'react'
import type {
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
} from '../../src/index.js'
import { BottomSheet, Sheet } from '../../src/index.js'

const snapValues: SnapPointValue[] = [240, '240px', '50%', 'content']
const snapPoints: SnapPoint[] = snapValues.map((value, index) => ({
  id: String(index),
  value,
}))
const rootProps: SheetRootProps = {
  children: null,
  defaultOpen: true,
  defaultSnapPoint: '0',
  dismissible: true,
  modal: true,
  onOpenChange(open, details: OpenChangeDetails) {
    const reason: OpenChangeReason = details.reason
    void open
    void reason
  },
  onSnapPointChange(id) {
    void id
  },
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

void rootProps
void triggerProps
void closeProps
void backdropProps
void viewportProps
void contentProps
void handleProps
void titleProps
void descriptionProps
void portalProps

const buttonRef = createRef<HTMLButtonElement>()
const divRef = createRef<HTMLDivElement>()
const headingRef = createRef<HTMLHeadingElement>()
const paragraphRef = createRef<HTMLParagraphElement>()

export const primitives = (
  <Sheet.Root {...rootProps}>
    <Sheet.Trigger ref={buttonRef} asChild>
      <button type="button">Open</button>
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.Backdrop ref={divRef} />
      <Sheet.Viewport ref={divRef}>
        <Sheet.Content ref={divRef}>
          <Sheet.Handle ref={divRef} />
          <Sheet.Title ref={headingRef}>Title</Sheet.Title>
          <Sheet.Description ref={paragraphRef}>Description</Sheet.Description>
          <Sheet.Close ref={buttonRef}>Close</Sheet.Close>
        </Sheet.Content>
      </Sheet.Viewport>
    </Sheet.Portal>
  </Sheet.Root>
)

export const convenience = (
  <BottomSheet
    title="Title"
    description="Description"
    defaultOpen
    snapPoints={snapPoints}
    contentProps={{ className: 'content' }}
  >
    Content
  </BottomSheet>
)

// @ts-expect-error Snap point strings require px, %, or content.
const invalidSnapValue: SnapPointValue = 'half'
// @ts-expect-error Every snap point requires a stable id.
const invalidSnapPoint: SnapPoint = { value: 240 }
// @ts-expect-error Change reasons are a closed union.
const invalidReason: OpenChangeReason = 'programmatic'
// @ts-expect-error Trigger refs point to buttons.
const invalidTrigger = <Sheet.Trigger ref={divRef}>Open</Sheet.Trigger>
// @ts-expect-error BottomSheet requires a title.
const invalidBottomSheet = <BottomSheet>Content</BottomSheet>

void invalidSnapValue
void invalidSnapPoint
void invalidReason
void invalidTrigger
void invalidBottomSheet
