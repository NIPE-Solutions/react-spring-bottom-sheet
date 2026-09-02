# Version 5 Alpha Readiness Design

## Purpose

Prepare `5.0.0-alpha.0` for a deliberate public prerelease without publishing it
as part of the implementation pull request. This slice turns the current green
development branch into a reproducible release candidate with explicit package,
browser, type, security, deployment, and maintainer sign-offs.

The release candidate remains on the `v5` line. Publication under the npm `next`
tag is a separate protected operation that requires explicit maintainer approval
after this work is merged and all external setup is confirmed.

## Current baseline

The version 5 branch already has:

- a React 19-only package contract and Node.js 24 LTS toolchain;
- ESM, CommonJS, declaration, and four CSS entry points;
- unit, package, API-generation, accessibility, and browser tests;
- Chromium, Firefox, and WebKit CI jobs;
- JavaScript and CSS size budgets;
- a protected release workflow using npm trusted publishing and provenance;
- a static documentation website with preview deployments;
- an unreleased `5.0.0-alpha.0` changelog entry and a v4 migration guide.

The readiness work therefore audits and strengthens existing boundaries. It does
not redesign the component API or introduce another release system.

## Release invariants

The alpha candidate is ready only when every invariant below is machine-checked
where automation is reliable:

1. A clean Node.js 24 checkout installs with `npm ci`; no test or build may resolve
   tools from an ancestor checkout.
2. The built tarball, rather than repository source, is the artifact tested by
   clean consumer fixtures.
3. Every supported public prop, ref, callback detail, and snap-point value has a
   positive type assertion, while intentional misuse has a checked compile error.
4. ESM, CommonJS, TypeScript, CSS exports, package metadata, and React 19 peer
   requirements work from the packed artifact.
5. Chromium, Firefox, and WebKit cover the release-critical modal, non-modal,
   pointer, keyboard, scroll, resize, interruption, and reduced-motion flows.
6. Runtime dependency audit, package contents, bundle budgets, generated API data,
   documentation evidence, and the static website are current and reproducible.
7. A prerelease may publish only an exact, unused prerelease version to `next`.
   Stable versions may publish only from `main` to `latest`.
8. The repository never represents physical-device or assistive-technology checks
   as automated facts. Those results are recorded as maintainer sign-offs.

## Verification architecture

### Clean environment boundary

The canonical entry point is a release-readiness command that verifies Node 24,
requires a clean dependency install in CI, and composes the existing checks in a
stable order. Repository scripts must use project-local binaries. CI begins from
`npm ci`, so its result cannot depend on an existing `node_modules` directory.

The command reports actionable failures and does not mutate versions, tags,
registry state, or GitHub releases.

### Public type contract

The type fixture becomes an intentional specification of the complete exported
surface. It covers:

- all `Sheet` primitives and their forwarded ref element types;
- controlled and uncontrolled root state;
- callback values and `OpenChangeDetails` reasons;
- every `SnapPointValue` form;
- native element props and `asChild` composition;
- `BottomSheet` convenience props;
- rejected React 18 usage assumptions, invalid snap values, invalid callback
  signatures, invalid refs, and removed v4 props.

Negative assertions stay adjacent to the valid form they protect. The fixture is
compiled under strict TypeScript settings against built declarations.

### Packed consumer matrix

Package verification creates a temporary tarball and installs it into isolated
consumer projects. Consumers must not have access to repository aliases or source.
The matrix verifies:

- Node ESM import and package metadata;
- Node CommonJS loading;
- strict TypeScript compilation with React 19;
- each documented CSS subpath;
- absence of undeclared runtime dependencies;
- a package file allowlist that rejects source, test, cache, and build-metadata
  leakage.

Temporary projects and tarballs are removed on success and failure.

### Cross-browser behavior matrix

Existing Playwright scenarios are mapped to release-critical behaviors and all
three supported engines. Missing combinations receive focused tests; duplicate
scenarios are consolidated rather than multiplied. The matrix must cover:

- modal open, close, focus containment, restoration, and background isolation;
- non-modal interaction;
- mouse and touch dragging, flick selection, cancellation, and interruption;
- nested scrolling and handle-only dragging;
- viewport and content resize;
- reduced motion;
- custom portal containment;
- narrow viewport layout and documentation accessibility.

CI uploads engine-specific diagnostics when a browser job fails. No snapshots are
accepted solely because they were regenerated.

### Release policy validation

Release-policy tests parse package metadata and workflow structure to protect the
following rules:

- workflow dispatch is manual;
- the requested version exactly matches `package.json`;
- the version does not already exist on npm;
- `next` accepts prerelease versions and `latest` rejects them;
- `latest` is restricted to `main`;
- publishing uses the protected `npm` environment, OIDC, provenance, and public
  access;
- verification completes before publication;
- registry verification completes before GitHub release creation.

These tests validate repository policy. The external npm trusted-publisher and
GitHub environment configuration remain one-time maintainer checks because they
cannot be proven from source alone.

### Security and dependency evidence

Release evidence distinguishes two scopes:

- `npm audit --omit=dev` is the blocking consumer/runtime audit;
- a full development audit is recorded and triaged, but tooling-only advisories do
  not become claims about the published package.

The project must not claim that the entire development graph is vulnerability-free
when only the production graph has been verified. Any production advisory blocks
the alpha. Tooling advisories are documented with their reachability and upgrade
path.

### Readiness report

A checked maintainer document records the exact automated commands and the manual
sign-off matrix. It contains no generated timestamps or machine-specific paths, so
it stays reviewable and deterministic.

Automated evidence includes clean installation, static checks, unit tests, package
tests, all three browser engines, website tests, audit scope, tarball contents, and
bundle sizes. Manual sign-offs cover VoiceOver, keyboard-only use, iOS Safari,
Android Chrome, production-domain behavior, and npm/GitHub environment setup.

Unchecked manual items are explicit release blockers, not silent omissions.

## CI and deployment flow

Pull requests into `v5` run quality first and then the complete browser matrix.
The alpha-readiness command runs from the same clean checkout and produces no
publishable side effects. Vercel continues to create a preview for the pull
request.

After merge, the maintainer completes the manual sign-offs and verifies the Vercel
deployment. Only then may the protected Release workflow be dispatched from the
merged `v5` commit with version `5.0.0-alpha.0`, channel `next`, and the exact
confirmation phrase. The workflow rebuilds and verifies the artifact before npm
publication, checks the registry result, and creates a prerelease on GitHub.

## Failure handling

- Type, package, browser, audit, size, documentation, or workflow-policy failures
  block the pull request.
- A flaky browser result is investigated and fixed; retries do not replace a root
  cause.
- A production dependency advisory blocks publication until removed, upgraded, or
  explicitly redesigned out of the runtime.
- Failed npm publication never reuses the same published version. If the version
  exists, prepare the next prerelease version through a reviewed pull request.
- Registry verification failure stops GitHub release creation and requires
  maintainer investigation.
- Manual sign-off failures become focused issues and tested pull requests on `v5`.

## Scope boundaries

This slice includes verification code, fixtures, CI/release policy hardening,
release documentation, and corrections uncovered by those checks.

It excludes:

- publishing to npm, creating tags, or creating a GitHub release;
- moving the `latest` distribution tag;
- merging `v5` into `main`;
- changing the public API unless a discovered release blocker returns to design
  review;
- broad dependency upgrades unrelated to a verified release risk;
- claiming completion of manual checks that a maintainer has not performed.

## Acceptance criteria

The pull request is ready to merge when:

- the complete release-readiness command passes from a clean Node 24 checkout;
- positive and negative public type coverage matches the generated API manifest;
- packed consumers resolve only the tarball and pass for ESM, CommonJS, TypeScript,
  and CSS entry points;
- Chromium, Firefox, and WebKit pass the documented behavior matrix;
- production audit and bundle budgets pass;
- release workflow policy tests pass;
- the website builds and its displayed version and support claims match package
  metadata;
- the readiness report clearly separates completed automated checks from pending
  manual sign-offs;
- the branch contains no publication, tag, or registry mutation.
