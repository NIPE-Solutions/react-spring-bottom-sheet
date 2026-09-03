# Version 5.0.0 Alpha 0 Sign-off

Release candidate: `5.0.0-alpha.0`

Evidence recorded: 2026-09-03

## Automated evidence

- [x] `npm ci` completed from the release branch.
- [x] `npm run release:check` completed successfully.
- [x] Pull request CI passed on Node 24 LTS, Chromium, Firefox, WebKit, and
      Chromium touch in [pull request #29](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/pull/29).
- [x] The exact 49-file package artifact passed its ESM, CommonJS, TypeScript,
      stylesheet, metadata, audit, and size contracts.

## Maintainer sign-offs

- [ ] VoiceOver on macOS or iOS.
- [x] Keyboard-only modal and non-modal operation in production Chrome. Modal
      open and Escape dismissal restored focus to the trigger; the non-modal
      sheet left surrounding page controls operable.
- [ ] iOS Safari on a physical device.
- [ ] Android Chrome on a physical device.
- [x] Production domain, sitemap, social metadata, and representative docs and
      examples. The canonical domain, `robots.txt`, `sitemap.xml`, social image,
      API documentation, custom portal example, and non-modal example returned
      successful responses.
- [x] npm trusted publisher and GitHub `npm` environment protection. The npm
      publisher is restricted to `NIPE-Solutions/react-spring-bottom-sheet`,
      `.github/workflows/release.yml`, and the `npm` environment. Publishing
      requires OIDC or two-factor authentication; bypass-2FA tokens are
      disallowed. GitHub deployment branches are restricted to `main` and `v5`.

## Remaining release blockers

The VoiceOver, physical iOS Safari, and physical Android Chrome checks must be
completed before promoting version 5 to the stable `latest` channel. They do
not prevent publishing this build as an alpha on the `next` channel when a
maintainer explicitly authorizes publication.
