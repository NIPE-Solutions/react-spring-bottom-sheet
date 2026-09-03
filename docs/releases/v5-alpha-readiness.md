# Version 5 Alpha Readiness

This document defines the deterministic evidence required for the version 5
alpha. Running these commands does not publish a package, create a tag, move a
distribution tag, or create a GitHub release.

## Automated gates

- `npm ci`
- `npm run release:check`
- `npm run test:e2e`
- `npm run test:website:e2e`

`npm run release:check` fails at the first unsuccessful command and runs these
gates in order:

1. `npm run check`
2. `npm run test:browser-matrix`
3. `npm audit --omit=dev`
4. `npm pack --dry-run`

The browser-matrix command checks the release scenario inventory. Successful
Ubuntu execution of the Chromium, Firefox, WebKit, and Chromium touch jobs is
the final integration evidence; the inventory does not replace those runs.

The production audit, `npm audit --omit=dev`, is blocking. The full development
audit from `npm audit --json` is informational and must be separately triaged in
the pull request, including affected development commands and the available
upgrade path. Development-only findings do not override a successful production
audit and must not be presented as published-package vulnerabilities.

## Maintainer sign-offs required before publication

- [ ] VoiceOver on macOS or iOS
- [ ] Keyboard-only modal and non-modal operation
- [ ] iOS Safari on a physical device
- [ ] Android Chrome on a physical device
- [ ] Production domain, sitemap, social metadata, and examples
- [ ] npm trusted publisher and GitHub `npm` environment protection

Every sign-off above remains a release blocker until a maintainer performs and
records it. Repository automation cannot prove physical-device behavior,
assistive-technology behavior, production configuration, or external account
protection.
