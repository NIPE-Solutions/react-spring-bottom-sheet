# Migrating from version 4 to version 5

Version 5 is a deliberate redesign for React 19. It replaces the monolithic
component contract with compound components, named snap points, isolated CSS
entry points, and explicit controlled-state callbacks.

## Requirements

| Version 4                         | Version 5                                       |
| --------------------------------- | ----------------------------------------------- |
| React 16.14–18                    | React 19                                        |
| Multiple maintained Node versions | Node 24 LTS for development and CI              |
| Legacy and evergreen browsers     | Current evergreen Chromium, Firefox, and WebKit |

## Imports

| Version 4                         | Version 5                                             | Reason                                                      |
| --------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `BottomSheet`                     | `Sheet` compound API or `BottomSheet` convenience API | Compound parts allow deliberate composition.                |
| `BottomSheetRef`                  | Removed                                               | Snap state is controlled through props and callbacks.       |
| `BottomSheetProps`                | `BottomSheetProps`                                    | The type now describes the version 5 convenience component. |
| `/style.css` or `/dist/style.css` | `/styles.css`                                         | Package exports are explicit.                               |
| Custom copied stylesheet          | `/core.css` plus application CSS                      | Mechanics and visuals are separate contracts.               |

## Props

| Version 4 prop          | Version 5 replacement                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| `open`                  | `open` on `Sheet.Root` or `BottomSheet`                                         |
| `blocking`              | `modal`                                                                         |
| `onDismiss`             | `onOpenChange`; update controlled state when `open` becomes false               |
| `snapPoints(state)`     | `snapPoints: { id, value }[]`                                                   |
| `defaultSnap`           | `defaultSnapPoint` with a snap-point id                                         |
| `header`                | Compose content before the scroll region inside `Sheet.Content`                 |
| `footer`                | Compose content after the scroll region inside `Sheet.Content`                  |
| `sibling`               | Render beside `Sheet.Viewport` within `Sheet.Portal`                            |
| `initialFocusRef`       | Use normal autofocus semantics; modal focus chooses the first focusable control |
| `scrollLocking`         | Removed; modal coordination is owned by the component                           |
| `expandOnContentDrag`   | Removed; gesture ownership follows scroll boundaries                            |
| `skipInitialTransition` | Removed; respect `prefers-reduced-motion` for non-animated transitions          |

## Callbacks

| Version 4 callback      | Version 5 replacement                                        |
| ----------------------- | ------------------------------------------------------------ |
| `onDismiss()`           | `onOpenChange(false, details)`                               |
| `onSpringStart(event)`  | Removed; animation lifecycle is internal                     |
| `onSpringCancel(event)` | Removed; interruption is internal                            |
| `onSpringEnd(event)`    | Removed; use application state rather than animation state   |
| Ref `snapTo(value)`     | Control `activeSnapPoint` and handle `onSnapPointChange(id)` |

`onOpenChange` includes a reason: `trigger`, `close`, `escape`, `backdrop`,
`drag`, or `imperative`.

## CSS

Version 4 exposed `data-rsbs-*` selectors and animation variables as its primary
customization surface. Version 5 uses stable `rsbs-*` classes and keeps the
motion engine private.

| Version 4                               | Version 5                                     |
| --------------------------------------- | --------------------------------------------- |
| `[data-rsbs-root]`                      | `.rsbs-viewport` and `.rsbs-content`          |
| `[data-rsbs-backdrop]`                  | `.rsbs-backdrop`                              |
| `[data-rsbs-overlay]`                   | `.rsbs-content`                               |
| `[data-rsbs-header]`                    | Consumer element inside `.rsbs-content`       |
| `[data-rsbs-scroll]`                    | Consumer scroll region inside `.rsbs-content` |
| `[data-rsbs-footer]`                    | Consumer element inside `.rsbs-content`       |
| `--rsbs-translate` and spring variables | Removed; motion is not a public styling API   |
| `--rsbs-bg`                             | `--rsbs-surface-background`                   |
| `--rsbs-backdrop-bg`                    | `--rsbs-backdrop-background`                  |
| `--rsbs-handle-bg`                      | `--rsbs-handle-background`                    |
| `--rsbs-overlay-rounded`                | `--rsbs-surface-radius`                       |

Use `/styles.css` for the complete theme. For a replacement theme, import
`/core.css` and style the namespaced classes in application CSS.

## Minimal controlled migration

```tsx
const [open, setOpen] = useState(false)

<Sheet.Root open={open} onOpenChange={setOpen}>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.Backdrop />
    <Sheet.Viewport>
      <Sheet.Content>
        <Sheet.Handle />
        <Sheet.Title>Details</Sheet.Title>
        <Sheet.Close>Close</Sheet.Close>
      </Sheet.Content>
    </Sheet.Viewport>
  </Sheet.Portal>
</Sheet.Root>
```
