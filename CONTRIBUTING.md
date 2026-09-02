# Contributing

Thanks for helping maintain React Spring Bottom Sheet.

## Development setup

Use Node.js 22 or 24 and install dependencies with:

```sh
npm ci
```

Run the complete local quality gate before opening a pull request:

```sh
npm run check
npm run test:e2e:install
npm run test:e2e
```

During development, the focused commands are:

```sh
npm run dev
npm run lint
npm run typecheck
npm run test:unit:watch
npm run build:dist
npm run build:docs
npm run test:package
```

## Compatibility

The v4 line preserves the existing public API and supports React 16.14 through
React 19. Bug fixes should include a regression test. Changes to exports, types,
focus behavior, gestures, transitions, or accessibility semantics should also be
covered by the packed-package or browser test suite where appropriate.

Breaking changes belong in the planned v5 release and must include migration
documentation.

## Pull requests

Keep changes focused, update `CHANGELOG.md` when behavior changes, and use clear,
imperative commit subjects. The continuous-integration checks must pass before a
change is merged.
