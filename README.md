# React Spring Bottom Sheet

Accessible, composable bottom sheets for React 19. Version 5 owns its gesture,
layout, accessibility, and motion boundaries while keeping animation details out
of the public API.

> Version 5 is currently in alpha. Use the latest stable 4.x release in
> production until the prerelease program is complete.

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
the [v4 to v5 migration guide](docs/migration-v4-to-v5.md), and the
[contribution guide](CONTRIBUTING.md).

## Project lineage

The project was created by Cody Olsen in
[stipsan/react-spring-bottom-sheet](https://github.com/stipsan/react-spring-bottom-sheet)
and later maintained in
[JasGH/react-spring-bottom-sheet](https://github.com/JasGH/react-spring-bottom-sheet).
This fork remains in that GitHub fork network and is independently maintained by
[NIPE Solutions](https://github.com/NIPE-Solutions). The original authorship and
MIT license notices are preserved.

## License

MIT
