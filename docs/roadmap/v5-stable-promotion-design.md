# Version 5 Stable Promotion Design

## Objective

Publish `@nipe-solutions/react-spring-bottom-sheet@5.0.0` to npm's `latest`
channel, make version 5 the repository's default maintained line, and keep the
website's availability statements accurate throughout the promotion.

The promotion must preserve branch protection, immutable package versions,
trusted publishing, reviewable release evidence, and the existing separation
between repository checks and external maintainer sign-offs.

## Starting state

- `v5` contains the complete version 5 implementation and the published
  `5.0.0-alpha.0` package.
- npm points `next` to `5.0.0-alpha.0` and `latest` to `4.1.0`.
- `main` still represents version 4 and contains a small dependency lockfile
  change that is not an ancestor of `v5`.
- The alpha's automated and manual sign-offs are recorded in
  `docs/releases/v5-alpha.0-signoff.md`.
- Stable publication is restricted to the protected Release workflow running
  from `main`.

## Promotion sequence

### 1. Prepare the stable candidate on `v5`

Create a reviewed branch from `v5` and incorporate the current `main` history.
Resolve the lockfile from the version 5 dependency graph so the eventual
`v5`-to-`main` promotion has a clean ancestry and does not reintroduce version 4
dependencies or source files.

In the same release-preparation branch:

- change `package.json` and `package-lock.json` to `5.0.0` without creating a
  tag;
- finalize the `5.0.0` changelog entry and comparison link;
- add a stable-release evidence file that identifies carried-forward alpha
  evidence and leaves post-deployment checks explicitly pending;
- represent `5.0.0` as prepared but unpublished in the website release-state
  model;
- update homepage and installation copy so an unpublished stable build is never
  described as available from npm;
- add tests for prerelease, prepared-stable, and published-stable presentation.

The pull request targets `v5`. It must pass the full repository checks and all
configured browser projects before merge.

### 2. Promote `v5` to `main`

Open a dedicated pull request from `v5` to `main`. This pull request is the
public code-line transition and contains no new implementation work. Required
checks, review, and the Vercel preview must pass before merge.

After merge, `main` becomes the only source for the stable release. The `v5`
branch remains temporarily available until publication and post-release checks
are complete; it is not used to publish `latest`.

### 3. Record production sign-off on `main`

Wait for the production Vercel deployment from `main`, then verify the canonical
domain, representative documentation and examples, sitemap, robots file, and
social metadata. Confirm that npm trusted publishing and the protected GitHub
environment still match the stable workflow.

Record those results in the stable-release evidence file through a focused pull
request into `main`. This is the final publication gate. It must not claim npm
publication or stable website availability.

### 4. Publish `5.0.0`

From the exact signed-off `main` commit, dispatch the protected Release workflow
with:

- version `5.0.0`;
- channel `latest`;
- confirmation `publish 5.0.0 with latest`.

Approve the `npm` environment deployment. The workflow must complete registry
verification before it creates the GitHub release.

After publication, verify:

- `npm view @nipe-solutions/react-spring-bottom-sheet@latest version` returns
  `5.0.0`;
- `next` still resolves to `5.0.0-alpha.0` unless intentionally changed in a
  separate operation;
- npm displays provenance for `5.0.0`;
- GitHub has a non-prerelease `v5.0.0` release targeting the published commit;
- a clean React 19 consumer can install, import, type-check, and load the
  package styles.

The failed alpha workflow must not be rerun, and no existing package version or
tag may be overwritten.

### 5. Publish accurate post-release website state

After the registry checks succeed, open a focused pull request into `main` that
marks `5.0.0` as published in the website release-state model. The rendered
homepage and installation guide must then present the normal stable install
command and remove all prepared-release qualifiers.

This final separation prevents both false early availability claims and a
release workflow that mutates repository content.

## Release-state model

Release presentation is derived from the package version and an explicit set of
versions known to be public. It exposes:

- the intended npm channel;
- the install command;
- whether the version is a prerelease;
- whether that exact version is published.

The prepared `5.0.0` commit does not enter the published set. The post-release
website pull request adds it only after independent registry verification.
Components must base unpublished messaging on `published`, not on prerelease
status, so the same contract covers future release candidates and stable
versions.

## Evidence and testing

The stable-preparation and promotion pull requests require:

- formatting, lint, TypeScript, unit, API, CSS, package, size, and website
  checks;
- production dependency audit and package dry run;
- Chromium, Firefox, WebKit, and Chromium touch library coverage;
- Chromium, Firefox, and WebKit website coverage;
- release-policy tests proving stable publication remains restricted to `main`
  and `latest`;
- website tests covering prepared and published release copy.

External checks remain separately recorded because repository automation cannot
prove physical-device behavior, assistive-technology behavior, production
deployment state, or external account configuration.

## Failure handling

- A merge conflict is resolved on the preparation branch and reverified; branch
  protection is never bypassed.
- A failed required check blocks the relevant pull request.
- A failed production deployment blocks stable sign-off and publication.
- A failed publish before npm accepts the version may be diagnosed and retried
  from the same immutable commit.
- If npm accepts `5.0.0` but a later workflow step fails, publication is treated
  as successful and recovery completes the missing GitHub or website state
  without attempting to republish `5.0.0`.
- Distribution tags are changed only through an explicitly authorized release
  operation.

## Completion criteria

The promotion is complete when `main` contains the version 5 codebase, npm
resolves `latest` to `5.0.0`, the GitHub stable release targets the published
commit, provenance and clean-consumer checks pass, the production website states
that `5.0.0` is available, and all temporary release branches and owned
worktrees have been cleaned up after their pull requests merge.
