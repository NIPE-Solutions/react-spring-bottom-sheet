# React Spring Bottom Sheet

[![npm version](https://img.shields.io/npm/v/%40nipe-solutions%2Freact-spring-bottom-sheet?logo=npm&label=npm)](https://www.npmjs.com/package/@nipe-solutions/react-spring-bottom-sheet)
[![CI](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-0f766e.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-087ea4.svg?logo=react)](https://react.dev/)

Accessible, composable bottom sheets for React 19. An independently maintained continuation of the original `react-spring-bottom-sheet`, rebuilt with compound components, explicit styling contracts, and current-browser verification.

[Live docs](https://react-spring-bottom-sheet.nipesolutions.com) · [Live demo](https://react-spring-bottom-sheet.nipesolutions.com/examples) · [Migration from the original](https://react-spring-bottom-sheet.nipesolutions.com/migration-from-react-spring-bottom-sheet/) · [API reference](https://react-spring-bottom-sheet.nipesolutions.com/api) · [npm](https://www.npmjs.com/package/@nipe-solutions/react-spring-bottom-sheet)

## Why version 5

- Built for React 19 with accessible dialog and focus behavior backed by
  explicit accessibility tests.
- Interruption-safe gestures and motion keep the sheet responsive through rapid
  input and state changes.
- Replaceable styling contracts let applications own the visual design without
  fighting library mechanics.
- Verified against current evergreen Chromium, Firefox, and WebKit browsers.

## Migrating from the original package

Move from `react-spring-bottom-sheet` to
`@nipe-solutions/react-spring-bottom-sheet` with the [dedicated migration
page](https://react-spring-bottom-sheet.nipesolutions.com/migration-from-react-spring-bottom-sheet/)
and the [detailed repository guide](docs/migration-v4-to-v5.md).

## Install

```bash
npm install @nipe-solutions/react-spring-bottom-sheet
```

Import the complete default styling once from your application entry point:

```ts
import '@nipe-solutions/react-spring-bottom-sheet/styles.css'
```

## Example

```tsx
import { Sheet } from '@nipe-solutions/react-spring-bottom-sheet'

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

`BottomSheet` is available as a convenience component for the common structure.

## Styles

- `/styles.css` includes required mechanics and the default theme.
- `/core.css` includes mechanics only and is required for every sheet.
- `/theme.css` includes the optional visual theme and token defaults.
- `/tokens.css` exposes the default token declarations separately.

All library-owned classes and custom properties use the `rsbs` namespace.
Mechanical selectors use low specificity so an application can replace the
visual design with ordinary CSS and without `!important`.

## Support

- React 19
- Node.js 24 LTS for development, CI, and releases
- Current evergreen Chromium, Firefox, and WebKit browsers
- TypeScript declarations, ESM, and CommonJS package entry points

Read the [documentation](https://react-spring-bottom-sheet.nipesolutions.com),
the [migration guide](docs/migration-v4-to-v5.md), and the [contribution
guide](CONTRIBUTING.md).

## Project lineage

The project was created by Cody Olsen in
[stipsan/react-spring-bottom-sheet](https://github.com/stipsan/react-spring-bottom-sheet)
and later maintained by Jasmine GH in
[JasGH/react-spring-bottom-sheet](https://github.com/JasGH/react-spring-bottom-sheet).
This fork remains in that GitHub fork network and is independently maintained by
[NIPE Solutions](https://github.com/NIPE-Solutions). The original authorship and
MIT license notices are preserved.

## License

MIT
