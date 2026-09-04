# Version 5 Alpha Readiness

This document defines the deterministic evidence required for the version 5
alpha. Running these commands does not publish a package, create a tag, move a
distribution tag, or create a GitHub release.

## Automated gates

- `npm ci --no-audit`
- `npm run release:check`
- `npm run test:e2e`
- `npm run test:website:e2e`

`npm run release:check` fails at the first unsuccessful command and runs these
gates in order:

1. `npm run check`
2. `npm run test:browser-matrix`
3. `npm pack --dry-run`

The browser-matrix command checks the release scenario inventory. Successful
Ubuntu execution of the Chromium, Firefox, WebKit, and Chromium touch jobs is
the final integration evidence; the inventory does not replace those runs.

The clean install and readiness command do not call the npm audit endpoint. Run
`npm audit --json` separately when audit evidence is needed; it is non-blocking
and should be triaged in the pull request, including affected development commands
and the available upgrade path. Development-only findings must not be presented as
published-package vulnerabilities.

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
