# React Spring Bottom Sheet

[![npm version](https://img.shields.io/npm/v/%40nipe-solutions%2Freact-spring-bottom-sheet?logo=npm&label=npm)](https://www.npmjs.com/package/@nipe-solutions/react-spring-bottom-sheet)
[![CI](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-0f766e.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-087ea4.svg?logo=react)](https://react.dev/)

A draggable bottom sheet for React 19, with dialog semantics, focus management,
snap points, and scroll-aware gestures. Use it for filters, account actions, or
details that should stay close to the page the user is working on.

This is an independently maintained continuation of the original
`react-spring-bottom-sheet`. Version 5 uses a redesigned compound API; existing
applications need to follow the migration guide.

[Live docs](https://react-spring-bottom-sheet.nipesolutions.com) · [Live demo](https://react-spring-bottom-sheet.nipesolutions.com/examples) · [Migration from the original](https://react-spring-bottom-sheet.nipesolutions.com/migration-from-react-spring-bottom-sheet/) · [API reference](https://react-spring-bottom-sheet.nipesolutions.com/docs/api/) · [npm](https://www.npmjs.com/package/@nipe-solutions/react-spring-bottom-sheet)

## When to use it

Choose a sheet when the interaction benefits from dragging between heights or
sharing space with the page. Modal sheets contain focus and isolate background
content; `modal={false}` supports persistent panels such as map details. Named
snap points can be content-sized, pixel heights, or viewport percentages.

For a simple dialog with no dragging or snap behavior, a native `<dialog>` or an
existing dialog component may be enough. This version requires React 19 and
current evergreen browsers; it is not a drop-in replacement for version 4.

## Install

In an application with React 19 and React DOM 19:

```bash
npm install @nipe-solutions/react-spring-bottom-sheet
```

## Quick start

Import the complete default stylesheet once. In a Next.js App Router application,
put interactive sheet components behind a client boundary and import the
stylesheet from the location your application uses for global CSS.

```tsx
'use client'

import { Sheet } from '@nipe-solutions/react-spring-bottom-sheet'
import '@nipe-solutions/react-spring-bottom-sheet/styles.css'

export function AccountActions() {
  return (
    <Sheet.Root snapPoints={[{ id: 'content', value: 'content' }]}>
      <Sheet.Trigger>Open account actions</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Account actions</Sheet.Title>
            <Sheet.Description>
              Choose what you want to do next.
            </Sheet.Description>
            <Sheet.Close>Done</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
```

The example manages its own open state. To connect it to application state, use
`open` and `onOpenChange` together. Keep `Sheet.Title` in the content so the
dialog has an accessible name; `Sheet.Description` supplies optional context.

See [component anatomy](https://react-spring-bottom-sheet.nipesolutions.com/docs/anatomy/),
[state](https://react-spring-bottom-sheet.nipesolutions.com/docs/state/), and the
[examples](https://react-spring-bottom-sheet.nipesolutions.com/examples) for
controlled sheets, forms, and multiple snap points.

## Why version 5

Compound components let you place actions, scroll regions, and surrounding
content while the library owns gestures, motion, and modal coordination.
`BottomSheet` provides the common structure as a convenience component. The
mechanical stylesheet and optional theme have separate entry points, so you can
keep the behavior while supplying your own design. Read the
[accessibility guide](https://react-spring-bottom-sheet.nipesolutions.com/docs/accessibility/)
for dialog naming, focus, and non-modal behavior.

## Styles

- `/styles.css` includes required mechanics and the default theme.
- `/core.css` includes mechanics only and is required for every sheet.
- `/theme.css` includes the optional visual theme and token defaults.
- `/tokens.css` exposes the default token declarations separately.

Use `/styles.css` for the example above. For your own theme, import `/core.css`
and supply application CSS; omitting the mechanical stylesheet breaks the
positioning and interaction contract.

All library-owned classes and custom properties use the `rsbs` namespace.
Mechanical selectors use low specificity so an application can replace the
visual design with ordinary CSS and without `!important`.

## Support

- React 19
- Node.js 24 LTS for development, CI, and releases
- Current evergreen Chromium, Firefox, and WebKit browsers
- TypeScript declarations, ESM, and CommonJS package entry points

Gesture, dialog, focus, and styling behavior are covered by repository tests,
including automated browser scenarios. Validate the sheet inside your own
scroll containers, overlay stack, and target devices. A custom portal container
must establish the size and clipping boundary the sheet should fill; see
[portals and layering](https://react-spring-bottom-sheet.nipesolutions.com/docs/portals/).

## Migrating from the original package

Move from `react-spring-bottom-sheet` to
`@nipe-solutions/react-spring-bottom-sheet` with the [dedicated migration
page](https://react-spring-bottom-sheet.nipesolutions.com/migration-from-react-spring-bottom-sheet/)
and the [detailed repository guide](docs/migration-v4-to-v5.md). Props, refs,
callbacks, snap points, and CSS selectors changed in version 5.

For development and contributions, read [CONTRIBUTING.md](CONTRIBUTING.md).

## Project lineage

The project was created by Cody Olsen in
[stipsan/react-spring-bottom-sheet](https://github.com/stipsan/react-spring-bottom-sheet)
and later maintained by Jasmine GH in
[JasGH/react-spring-bottom-sheet](https://github.com/JasGH/react-spring-bottom-sheet).
This fork remains in that GitHub fork network and is independently maintained by
[NIPE Solutions](https://github.com/NIPE-Solutions). The original authorship and
MIT license notices are preserved.

## License

[MIT](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for preserved
dependency notices.
