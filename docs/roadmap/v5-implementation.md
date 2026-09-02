# Version 5 Implementation Plan

**Goal:** Deliver a production-ready React 19 bottom-sheet library with an owned interaction model, a composable public API, isolated styling, complete documentation, and a deployed website.

**Architecture:** Pure controller and layout modules define behavior. React primitives coordinate those modules with DOM, accessibility, gestures, and a replaceable Motion adapter. Required mechanical CSS and optional visual CSS are namespaced and distributed separately.

**Technology:** React 19, TypeScript, Motion, Vitest, Testing Library, Playwright, Next.js, npm, GitHub Actions, and Vercel.

**Specification:** `docs/roadmap/v5-architecture.md`

## Global constraints

- React 19 is the only supported React major.
- Node.js 24 LTS is used for development, CI, and releases.
- Runtime dependencies are limited to dependencies that remove substantial complexity and remain hidden behind internal boundaries.
- No animation-library type or concept may appear in the public API.
- All owned CSS classes, custom properties, and state attributes use the `rsbs` namespace.
- `core.css` contains mechanics only; `theme.css` is optional; `styles.css` combines both.
- Work is performed in isolated worktrees and merged through reviewed pull requests.
- Every PR must leave its branch passing lint, types, unit tests, package tests, and applicable browser or website tests.
- Public behavior requires tests and documentation in the PR that introduces it.
- Preserve the GitHub fork relationship, original MIT notices, authorship metadata, and visible upstream attribution.

## Delivery sequence

| PR | Branch | Deliverable | Depends on |
| --- | --- | --- | --- |
| 1 | `feat/v5-foundation` | Modern toolchain, package exports, React 19 baseline | Architecture PR |
| 2 | `feat/v5-controller-layout` | Pure controller, snap-point and layout contracts | PR 1 |
| 3 | `feat/v5-components-accessibility` | Compound React API and accessible modal behavior | PR 2 |
| 4 | `feat/v5-gestures-motion` | Dragging, scroll arbitration, settling, interruption | PR 3 |
| 5 | `feat/v5-styling` | Namespaced mechanical CSS and optional default theme | PR 4 |
| 6 | `feat/v5-docs-site` | README, migration guide, documentation site | PR 5 |
| 7 | `release/v5-beta` | Cross-browser hardening, prerelease, deployment | PR 6 |

Each PR is cut from the updated `main` branch after its dependency has merged. Do not stack the complete program into one branch.

## PR 1: Modern foundation and package contract

### File responsibilities

- `package.json`: package metadata, scripts, exports, peers, and dependency policy.
- `package-lock.json`: reproducible dependency graph.
- `.nvmrc`: Node.js 24 development version.
- `tsconfig.json`: shared strict TypeScript settings.
- `tsconfig.build.json`: declaration and library build inputs.
- `vite.config.ts`: library build for ESM and CommonJS.
- `vitest.config.ts`: unit and component test environment.
- `eslint.config.js`: flat lint configuration.
- `src/index.ts`: intentional public export boundary.
- `src/public-types.ts`: dependency-neutral public types.
- `test/package/verify-package.mjs`: packed-consumer verification.
- `.github/workflows/ci.yml`: Node 24 verification pipeline.

### Public types produced

```ts
export type OpenChangeReason =
  | 'trigger'
  | 'close'
  | 'escape'
  | 'backdrop'
  | 'drag'
  | 'imperative'

export interface OpenChangeDetails {
  reason: OpenChangeReason
}

export type SnapPointValue = number | `${number}px` | `${number}%` | 'content'

export interface SnapPoint {
  id: string
  value: SnapPointValue
}
```

### Tasks

- [ ] Create a worktree from current `main` on `feat/v5-foundation` and run the existing test suite to record the baseline.
- [ ] Add package tests that assert React 19 peer metadata, the new export map, CSS entry points, ESM import, CommonJS loading where supported, and declaration availability; run them and confirm they fail against v4.
- [ ] Replace Microbundle and legacy ESLint configuration with Vite library mode, strict TypeScript build configuration, and flat ESLint configuration.
- [ ] Upgrade the development baseline to React 19 and Node 24; remove React 16-18 compatibility jobs from the v5 branch.
- [ ] Remove obsolete v4 runtime packages only after build imports no longer require them. Add Motion as the sole animation runtime dependency behind an internal boundary.
- [ ] Define the public types above and export only deliberate public symbols from `src/index.ts`.
- [ ] Configure package exports for `.`, `./core.css`, `./theme.css`, `./styles.css`, and `./package.json`.
- [ ] Pack the package with `npm pack`, install the tarball into isolated ESM and TypeScript consumers, and make the new package assertions pass.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build:dist`, and `npm run test:package`.
- [ ] Commit with focused conventional commits, push the branch, and open PR 1 with the support policy and package-contract changes called out explicitly.

## PR 2: Controller and layout engine

### File responsibilities

- `src/controller/types.ts`: controller state, event, command, and callback types.
- `src/controller/reducer.ts`: pure state transition function.
- `src/controller/create-controller.ts`: imperative event dispatch and subscription boundary.
- `src/controller/invariants.ts`: development assertions for invalid transitions.
- `src/layout/types.ts`: measured viewport and resolved snap-point types.
- `src/layout/resolve-snap-points.ts`: normalize public snap points into pixels.
- `src/layout/select-settle-target.ts`: destination selection from position and velocity.
- `src/layout/reconcile-active-snap-point.ts`: resize and content-change reconciliation.
- Matching `*.test.ts` files: table-driven behavioral coverage.

### Interfaces produced

```ts
export type TransitionPhase =
  | 'closed'
  | 'opening'
  | 'open'
  | 'dragging'
  | 'settling'
  | 'closing'

export interface SheetState {
  phase: TransitionPhase
  open: boolean
  activeSnapPoint: string | null
  position: number
  targetPosition: number
}

export type SheetEvent =
  | { type: 'OPEN_REQUESTED'; reason: OpenChangeReason }
  | { type: 'CLOSE_REQUESTED'; reason: OpenChangeReason }
  | { type: 'DRAG_STARTED'; position: number }
  | { type: 'DRAG_MOVED'; position: number }
  | { type: 'DRAG_ENDED'; position: number; velocity: number }
  | { type: 'LAYOUT_CHANGED'; layout: ResolvedLayout }
  | { type: 'SETTLED'; position: number }

export interface SheetController {
  getState(): SheetState
  dispatch(event: SheetEvent): void
  subscribe(listener: (state: SheetState) => void): () => void
}
```

### Tasks

- [ ] Write table-driven failing tests for every legal phase transition and for rejected impossible transitions.
- [ ] Implement the pure reducer with no React, DOM, or Motion imports; run the controller tests until they pass.
- [ ] Write failing subscription tests for dispatch ordering, re-entrant controlled updates, and unsubscribe cleanup.
- [ ] Implement `createSheetController` around the reducer and make subscription tests pass.
- [ ] Write failing snap-resolution tests for fractions, pixels, percentages, content height, safe areas, invalid values, duplicate IDs, and unreachable positions.
- [ ] Implement deterministic snap-point normalization and return development diagnostics separately from the resolved result.
- [ ] Write failing destination tests covering low velocity, flicks in either direction, bounds resistance, dismissal threshold, and equal-distance ties.
- [ ] Implement settle-target selection with named constants and documented units.
- [ ] Write failing reconciliation tests for viewport resize, virtual-keyboard resize, content resize, and removal of the active point.
- [ ] Implement nearest-valid-point reconciliation and make all layout tests pass.
- [ ] Run the full PR verification suite and open PR 2 with state diagrams and invariant notes in its description.

## PR 3: Compound components and accessibility

### File responsibilities

- `src/components/Root.tsx`: controlled/uncontrolled state and subsystem ownership.
- `src/components/Trigger.tsx`, `Close.tsx`: semantic activators with composition support.
- `src/components/Portal.tsx`: configurable portal target and SSR-safe mounting.
- `src/components/Backdrop.tsx`, `Viewport.tsx`, `Content.tsx`, `Handle.tsx`: DOM primitives and refs.
- `src/components/Title.tsx`, `Description.tsx`: accessible naming registration.
- `src/components/Sheet.ts`: compound export object.
- `src/components/BottomSheet.tsx`: convenience composition only.
- `src/context/sheet-context.ts`: validated internal context contract.
- `src/accessibility/focus.ts`: initial focus, containment, and restoration.
- `src/accessibility/isolation.ts`: modal background isolation and cleanup.
- `src/accessibility/ids.ts`: stable title and description relationships.
- `src/composition/Slot.tsx`: local `asChild` implementation with merged refs and handlers.

### Public interfaces produced

```ts
export interface SheetRootProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void
  snapPoints?: readonly SnapPoint[]
  activeSnapPoint?: string
  defaultSnapPoint?: string
  onSnapPointChange?: (id: string) => void
  modal?: boolean
}
```

Every DOM primitive exposes its native element props, a forwarded ref, and `asChild?: boolean`.

### Tasks

- [ ] Write failing tests for controlled and uncontrolled open state, callback reasons, controlled overrides, and Strict Mode remount behavior.
- [ ] Implement `Root` with the controller and a validated internal context; do not add gesture behavior yet.
- [ ] Write failing composition tests for native elements, `asChild`, handler ordering, ref merging, disabled triggers, and nested interactive content.
- [ ] Implement `Slot`, `Trigger`, `Close`, `Backdrop`, `Viewport`, `Content`, and `Handle` with stable namespaced attributes.
- [ ] Write failing SSR and portal tests for missing `document`, default body mounting, custom containers, and cleanup.
- [ ] Implement the portal boundary and make hydration behavior deterministic.
- [ ] Write failing accessibility tests for dialog role, title and description registration, initial focus, Tab containment, Escape, restoration, modal isolation, and non-modal behavior.
- [ ] Implement naming, focus, Escape handling, and background isolation with cleanup on every exit path.
- [ ] Implement `BottomSheet` strictly as a composition of public primitives and add parity tests against the equivalent manual composition.
- [ ] Run automated accessibility assertions and manually verify keyboard operation in the fixture application.
- [ ] Run the full PR verification suite and open PR 3 with the public API rendered in its description.

## PR 4: Gestures, scrolling, measurement, and motion

### File responsibilities

- `src/gestures/pointer-session.ts`: pointer lifecycle and capture cleanup.
- `src/gestures/normalize-pointer.ts`: position, direction, and velocity samples.
- `src/gestures/scroll-boundary.ts`: ownership decision for nested scrolling.
- `src/gestures/resistance.ts`: constrained overdrag calculation.
- `src/layout/observe-layout.ts`: viewport, content, safe-area, and keyboard measurements.
- `src/motion/types.ts`: library-owned animation interface.
- `src/motion/motion-adapter.ts`: the only Motion import boundary.
- `src/hooks/use-sheet-interactions.ts`: connect DOM events to controller events.
- `src/hooks/use-sheet-layout.ts`: connect observers to layout events.
- `src/hooks/use-sheet-motion.ts`: execute controller motion commands.

### Motion boundary produced

```ts
export interface MotionRequest {
  from: number
  to: number
  velocity: number
  reducedMotion: boolean
  onUpdate(value: number): void
  onComplete(): void
}

export interface MotionHandle {
  stop(): void
}

export interface MotionAdapter {
  start(request: MotionRequest): MotionHandle
}
```

### Tasks

- [ ] Write failing pure tests for velocity sampling, direction changes, overdrag resistance, and scroll-boundary ownership.
- [ ] Implement gesture calculations without React or DOM dependencies and make the pure tests pass.
- [ ] Write failing integration tests for pointer capture, cancellation, blur, unmount, multi-touch interruption, and handle-only dragging.
- [ ] Implement pointer sessions with one cleanup path used by completion, cancellation, and unmount.
- [ ] Write failing nested-scroll tests for top, middle, bottom, upward movement, downward movement, and a scrollable descendant inside another scrollable element.
- [ ] Implement scroll arbitration and verify that content and sheet never consume the same movement.
- [ ] Write failing observer tests for viewport resize, content resize, safe-area values, virtual-keyboard changes, and observer disposal.
- [ ] Implement layout observation and dispatch normalized `LAYOUT_CHANGED` events.
- [ ] Write a fake motion adapter and failing tests for opening, closing, snapping, interruption, controlled overrides, and reduced motion.
- [ ] Implement the library-owned motion contract, then implement the Motion-backed adapter in one file.
- [ ] Connect interaction, layout, and motion hooks to `Root`, `Viewport`, `Content`, and `Handle`.
- [ ] Add Playwright scenarios for mouse drag, touch drag, nested scrolling, flicks, resize, immediate drag during opening, and interrupted settling.
- [ ] Run unit tests and Playwright on Chromium, Firefox, and WebKit; open PR 4 only when all supported engines pass.

## PR 5: Styling system

### File responsibilities

- `src/styles/core.css`: namespaced mechanical rules only.
- `src/styles/theme.css`: optional default visuals.
- `src/styles/styles.css`: imports core and theme.
- `src/styles/tokens.css`: documented theme custom properties, imported only by theme.
- `scripts/check-css-namespace.mjs`: reject global and unscoped owned selectors.
- `test/styles/exports.test.ts`: package CSS entry verification.
- `pages/fixtures/custom-theme.tsx`: complete theme replacement example.

### Tasks

- [ ] Write failing package tests for the three CSS exports and failing namespace tests for generic selectors.
- [ ] Implement the namespace checker to reject type selectors, universal resets, unprefixed classes, unscoped state attributes, and unprefixed custom properties.
- [ ] Move positioning, visibility, containment, touch-action, and safe-area mechanics into `core.css` using low-specificity `:where(...)` selectors.
- [ ] Build `theme.css` from documented `--rsbs-*` tokens for backdrop, surface, handle, radius, shadow, and color.
- [ ] Make `styles.css` import the two layers in deterministic order and declare each file as a side effect in package metadata.
- [ ] Add tests proving custom classes are preserved, internal classes are namespaced, theme omission does not break mechanics, and ordinary consumer rules override theme rules without `!important`.
- [ ] Add a fixture with no theme import and a complete custom design.
- [ ] Capture Playwright screenshots at mobile and desktop widths and review focus visibility, safe areas, dark mode, high contrast, and reduced motion.
- [ ] Run the full PR verification suite and open PR 5 with the CSS contract and before/after examples.

## PR 6: README and documentation website

### File responsibilities

- `README.md`: concise package entry point and minimal example.
- `docs/migration-v4-to-v5.md`: complete breaking-change mapping.
- `website/`: modern Next.js documentation application.
- `website/app/`: documentation routes and layouts.
- `website/components/`: navigation, examples, code samples, and accessibility helpers.
- `website/content/`: installation, anatomy, state, snaps, gestures, accessibility, styling, API, examples, and troubleshooting.
- `website/next.config.ts`: site build configuration.
- `vercel.json`: production and preview build settings.

### Tasks

- [ ] Move the legacy `pages` and presentation-only `docs` code into a dedicated `website` application while preserving useful examples and assets.
- [ ] Upgrade to the current supported Next.js release compatible with React 19 and Node 24.
- [ ] Configure the website to import local package source or workspace output during development and CI.
- [ ] Rewrite the README with installation, one compound-component example, support policy, CSS entry choices, documentation URL, and contribution links.
- [ ] Add a concise project-lineage section that credits the original project and maintainers, links to `JasGH/react-spring-bottom-sheet`, and identifies NIPE Solutions as the current independent maintainer.
- [ ] Write migration tables for every removed v4 prop, callback, CSS selector, custom property, and import path, each with a v5 replacement or explicit removal rationale.
- [ ] Add documentation routes for every topic required by the architecture specification.
- [ ] Add executable examples for controlled state, snap points, modal and non-modal use, nested scrolling, custom portals, custom styling, dark mode, and reduced motion.
- [ ] Make displayed code samples compile in CI and ensure interactive examples import the same symbols they display.
- [ ] Add metadata, canonical URLs, sitemap, social card, accessible navigation, responsive layout, and a visible package-version indicator.
- [ ] Configure Vercel previews for pull requests and production deployment from `main`; keep credentials and domain configuration outside the repository.
- [ ] Run the website build, link validation, accessibility checks, and Playwright documentation smoke tests.
- [ ] Open PR 6 with its preview URL and verify `react-spring-bottom-sheet.nipesolutions.com` is ready to attach after merge.

## PR 7: Beta hardening and release

### File responsibilities

- `e2e/`: final cross-browser behavior matrix.
- `test/types/`: public TypeScript contract tests.
- `test/package/`: clean packed-consumer matrix.
- `.github/workflows/ci.yml`: required browser, package, and website jobs.
- `.github/workflows/release.yml`: protected prerelease and stable publishing.
- `CHANGELOG.md`: version 5 release notes.
- `docs/RELEASING.md`: maintainer release procedure.

### Tasks

- [ ] Add type tests for all supported component props, refs, callback details, snap-point forms, and intentional compile failures.
- [ ] Test the packed tarball in clean React 19 ESM and TypeScript applications with no repository source resolution.
- [ ] Complete the Chromium, Firefox, and WebKit matrix for modal, non-modal, mouse, touch, keyboard, nested scroll, resize, virtual keyboard, and reduced motion behavior.
- [ ] Add bundle-size budgets for JavaScript and each CSS entry; fail CI on unexplained regression.
- [ ] Configure protected npm publishing with provenance, immutable version checks, and separate `next` and `latest` dist-tag flows.
- [ ] Publish `5.0.0-alpha.0` under the `next` tag and validate installation from the public registry.
- [ ] Collect prerelease defects as focused issues; fix each through its own tested pull request rather than directly on the release branch.
- [ ] Publish beta candidates after API stability, then run manual VoiceOver, keyboard, iOS Safari, and Android Chrome checks before the stable decision.
- [ ] Verify the production Vercel deployment, canonical domain, sitemap, social metadata, examples, and displayed package version.
- [ ] Finalize the changelog and migration guide, publish `5.0.0`, move the npm `latest` tag only after registry verification, create the GitHub release, and verify a clean consumer installation.

## Required verification commands

Every implementation PR runs the applicable subset locally and all commands in CI:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build:dist
npm run test:package
npm run test:e2e
npm run build:website
```

Release verification additionally runs:

```bash
npm pack --dry-run
npm view @nipe-solutions/react-spring-bottom-sheet@next version
npm view @nipe-solutions/react-spring-bottom-sheet@latest version
```

## Review policy

Each pull request must explain its public behavior, internal boundary, test evidence, and migration impact. Reviewers should reject dependency leakage, generic CSS selectors, unexplained public exports, DOM access in pure modules, or behavior without cross-browser coverage. Major API changes discovered during prerelease return to design review before implementation.
