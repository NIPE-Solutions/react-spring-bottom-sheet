# Releasing

Publishing changes the package consumed by downstream applications. Complete the
following checks from a clean checkout and publish only after the intended version
and npm distribution tag have been explicitly confirmed.

## Release checklist

1. Confirm continuous integration passes on the release commit.
2. Confirm `CHANGELOG.md` describes the release and contains the correct version.
3. Install from the lockfile and run all local checks:

   ```sh
   npm ci
   npm run check
   npm run test:e2e:install
   npm run test:e2e
   npm audit --omit=dev
   ```

4. Inspect the packed artifact and its consumer checks:

   ```sh
   npm pack --dry-run
   npm run test:package
   ```

5. Update the version without publishing, then commit and tag the release.
6. Publish a prerelease first when validating a new release process or a breaking
   major version.
7. Verify the package page, CommonJS and ESM imports, type declarations, and CSS
   export after publishing.
8. Create the repository release from the matching changelog entry.

Never publish as part of an unrelated maintenance change. Package publication
requires a separate, explicit confirmation of the version and npm distribution
tag.
