# Releasing

Package releases are immutable and run only through the protected `Release`
GitHub Actions workflow. The workflow uses npm trusted publishing with OpenID
Connect; it does not use a long-lived npm write token.

## One-time repository setup

1. On npm, configure the package trusted publisher for the
   `NIPE-Solutions/react-spring-bottom-sheet` repository and
   `.github/workflows/release.yml`. Allow `npm publish`.
2. In GitHub, create an `npm` environment with the maintainer as a required
   reviewer, permit the configured solo-maintainer self-review exception,
   disable administrator bypass, and restrict deployment branches to `main` and
   `v5` while prereleases are active.
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
   npm ci --no-audit
   npm run release:check
   npm run test:e2e
   npm run test:website:e2e
   ```

   The readiness command runs the repository checks, browser-matrix inventory,
   and package dry run in a fixed order. `npm ci --no-audit` and readiness do not
   contact the audit endpoint. Run `npm audit --json` separately when audit
   evidence is needed; it is non-blocking and development advisories should be
   triaged in the pull request without being presented as published runtime risk.

4. Confirm CI and the Vercel preview are green. Successful Ubuntu WebKit is the
   final browser integration evidence; the checked scenario inventory does not
   replace browser execution.
5. Complete every manual sign-off by using
   [`docs/releases/v5-alpha-readiness.md`](releases/v5-alpha-readiness.md) as the
   checklist and recording results in a version-specific file such as
   [`docs/releases/v5-alpha.0-signoff.md`](releases/v5-alpha.0-signoff.md).
   Physical-device, accessibility, production-domain, and external protection
   checks must remain distinguishable from automated evidence.
6. Merge the reviewed release commit. Do not bypass branch protection.
7. After merge, and only when a maintainer explicitly authorizes publication,
   run the `Release` workflow from the release commit with channel `next` and
   the exact confirmation phrase requested by the form.
8. Approve the protected `npm` environment deployment.
9. Verify the package and provenance on npm, then install it into a clean React
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
2. On a branch from `v5`, update the version to `5.0.0`, finalize the changelog,
   prepare unpublished website copy, record the available local evidence, and
   merge the reviewed preparation pull request back into `v5`.
3. Open a dedicated promotion pull request from `v5` to `main`. It is the code
   line transition and must contain no new implementation work. Wait for the
   required checks, independent pull-request review, and Vercel preview before
   asking the maintainer to merge it.
4. Wait for the production deployment from `main`. Verify the canonical domain,
   representative documentation and examples, sitemap, robots file, social
   metadata, displayed `5.0.0`, prepared-not-published wording, and a
   representative sheet interaction.
5. From a new branch at the exact deployed `origin/main`, verify npm trusted
   publishing and the protected GitHub environment against the setup above.
   Record those results in the stable evidence file through a focused production
   sign-off pull request into `main`. Wait for required checks and review, ask
   the maintainer to merge it, and do not claim publication in that pull request.
6. Fetch the merged sign-off commit and record its immutable identity:

   ```sh
   git fetch origin --prune
   SIGNED_OFF_SHA=$(git rev-parse origin/main)
   npm view @nipe-solutions/react-spring-bottom-sheet@5.0.0 version
   npm view @nipe-solutions/react-spring-bottom-sheet dist-tags --json
   ```

   Confirm `5.0.0` is absent, `latest` is still `4.1.0`, and `next` still points
   to the intended prerelease.

7. Only after explicit maintainer authorization, dispatch the protected
   `Release` workflow from `main` with version `5.0.0`, channel `latest`, and
   confirmation `publish 5.0.0 with latest`. Resolve the newly dispatched
   workflow's run ID as `RUN_ID`, then prove it targets the signed-off commit:

   ```sh
   test "$(gh run view "$RUN_ID" --json headSha --jq .headSha)" = "$SIGNED_OFF_SHA"
   ```

   Require that exact head SHA proof to pass before asking the configured
   maintainer to approve the protected environment deployment.

8. Verify `npm view @nipe-solutions/react-spring-bottom-sheet@latest version`,
   confirm `next` remains on the prerelease unless separately authorized, inspect
   npm provenance, verify the public non-prerelease GitHub release targets
   `SIGNED_OFF_SHA`, and install the package into a clean React 19 consumer.
9. After the registry checks succeed, open a focused website-state pull request
   into `main` that marks `5.0.0` as published. Wait for required checks, review,
   and Vercel; after merge, confirm production removes every prepared-release
   qualifier and presents the stable install command.

Publishing or moving a distribution tag always requires explicit maintainer
approval. Do not publish as part of an unrelated maintenance change.
