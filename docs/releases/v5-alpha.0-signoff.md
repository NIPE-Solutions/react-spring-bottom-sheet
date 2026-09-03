# Version 5.0.0 Alpha 0 Sign-off

Release candidate: `5.0.0-alpha.0`

Evidence recorded: 2026-09-03

## Automated evidence

- [x] `npm ci` completed from the release branch.
- [x] `npm run release:check` completed successfully.
- [x] `npm run test:e2e` passed on Chromium, Firefox, WebKit, and Chromium
      touch in [pull request #29](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/pull/29).
- [x] `npm run test:website:e2e` passed on Chromium, Firefox, and WebKit in
      [pull request #29](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/pull/29).
- [x] The exact 49-file package artifact passed its ESM, CommonJS, TypeScript,
      stylesheet, metadata, audit, and size contracts.

## Maintainer sign-offs

- [x] VoiceOver on macOS or iOS.
- [x] Keyboard-only modal and non-modal operation in production Chrome. Modal
      open and Escape dismissal restored focus to the trigger; the non-modal
      sheet left surrounding page controls operable.
- [x] iOS Safari on a physical device.
- [x] Android Chrome on a physical device.
- [x] Production domain, sitemap, social metadata, and representative docs and
      examples. The canonical domain, `robots.txt`, `sitemap.xml`, social image,
      API documentation, custom portal example, and non-modal example returned
      successful responses.
- [x] npm trusted publisher and GitHub `npm` environment protection. The npm
      publisher is restricted to `NIPE-Solutions/react-spring-bottom-sheet`,
      `.github/workflows/release.yml`, and the `npm` environment. Publishing
      requires OIDC or two-factor authentication; bypass-2FA tokens are
      disallowed. GitHub deployment branches are restricted to `main` and `v5`.

## Publication decision

All automated evidence and maintainer sign-offs required for the alpha are
complete. Publishing this build on the `next` channel still requires explicit
maintainer authorization through the protected release workflow.
