# Releasing

Package releases are immutable and run only through the protected `Release`
GitHub Actions workflow. The workflow uses npm trusted publishing with OpenID
Connect; it does not use a long-lived npm write token.

## One-time repository setup

1. On npm, configure the package trusted publisher for the
   `NIPE-Solutions/react-spring-bottom-sheet` repository and
   `.github/workflows/release.yml`. Allow `npm publish`.
2. In GitHub, create an `npm` environment with required reviewers, prevent
   self-review, disable administrator bypass, and restrict deployment branches
   to `main` and `v5` while prereleases are active.
3. Protect `main` and `v5`. Require the quality and browser jobs and disallow
   direct pushes.
4. Connect the repository to the NIPE Solutions Vercel project. Production
   deploys from `main`; pull requests receive previews. Keep domain ownership
   and credentials in Vercel.

## Prepare a prerelease

1. Choose an unused prerelease version such as `5.0.0-alpha.0` or
   `5.0.0-beta.1` and update `package.json` and `package-lock.json` without
   publishing.
2. Update `CHANGELOG.md` and the migration guide for every intentional public
   change.
3. From a clean checkout, run:

   ```sh
   npm ci
   npm run check
   npm run test:e2e
   npm run test:website:e2e
   npm audit --omit=dev
   npm pack --dry-run
   ```

4. Confirm CI and the Vercel preview are green. Test keyboard operation and run
   VoiceOver on macOS or iOS. Exercise the sheet in iOS Safari and Android
   Chrome on physical devices.
5. Merge the reviewed release commit. Do not bypass branch protection.
6. Run the `Release` workflow from the release commit with channel `next` and
   the exact confirmation phrase requested by the form.
7. Approve the protected `npm` environment deployment.
8. Verify the package and provenance on npm, then install it into a clean React
   19 application:

   ```sh
   npm view @nipe-solutions/react-spring-bottom-sheet@next version
   npm install @nipe-solutions/react-spring-bottom-sheet@next
   ```

Record prerelease defects as focused issues and fix them through reviewed pull
requests. Never reuse or overwrite a published version.

## Publish the stable release

1. Complete the prerelease program and all manual browser and assistive
   technology checks.
2. Update the version to `5.0.0`, finalize the changelog, and merge the final
   `v5` pull request into `main` after required approval.
3. Confirm the production website, canonical domain, sitemap, social metadata,
   examples, and displayed version.
4. Run the `Release` workflow from `main` with channel `latest` and approve the
   protected environment deployment.
5. Verify `npm view @nipe-solutions/react-spring-bottom-sheet@latest version`,
   the provenance statement, the generated GitHub release, and a clean consumer
   installation.

Publishing or moving a distribution tag always requires explicit maintainer
approval. Do not publish as part of an unrelated maintenance change.
