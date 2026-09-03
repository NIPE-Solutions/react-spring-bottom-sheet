# Version 5 Alpha Readiness Implementation Plan

**Goal:** Produce a reproducible, reviewable `5.0.0-alpha.0` release candidate without publishing, tagging, or changing the public API.

**Architecture:** Independent verification modules check repository policy, built declarations, the packed npm artifact, and the cross-browser matrix. A final side-effect-free readiness command composes those gates and a checked maintainer report separates automated evidence from external and physical-device sign-offs.

**Tech Stack:** Node.js 24, npm, TypeScript 6, React 19, Playwright, Node test runner, GitHub Actions, Vercel, npm trusted publishing.

**Spec:** `docs/roadmap/v5-alpha-readiness-design.md`

## Global Constraints

- React 19 is the only supported React major.
- Node.js 24 LTS is required for development, CI, and release verification.
- Do not change the package's public API in this slice.
- Do not add runtime dependencies.
- Do not publish to npm, create a tag or GitHub release, move a distribution tag, or merge `v5` into `main`.
- Verify the packed tarball rather than repository source for consumer behavior.
- Treat `npm audit --omit=dev` as the blocking consumer audit and report the full development audit separately.
- Keep manual VoiceOver, keyboard, iOS Safari, Android Chrome, production-domain, and external configuration checks visibly pending until a maintainer performs them.
- Every production change follows a red-green-refactor test cycle.
- Keep commits focused and conventional.

---

## File responsibility map

- `scripts/release-policy.mjs`: pure parsing and validation of package and release-workflow policy.
- `scripts/release-policy.test.mjs`: mutation-based policy regression tests.
- `test/types/public-api.tsx`: repository-level positive and negative source contract.
- `test/package/consumer-types.ts`: strict declaration contract compiled only from the installed tarball.
- `test/package/consumer-esm.mjs` and `consumer-cjs.cjs`: installed runtime and export smoke tests.
- `test/package/verify-package.mjs`: tarball allowlist, clean consumer creation, installation, execution, and cleanup.
- `scripts/browser-matrix.mjs`: pure expected coverage model for release-critical behavior.
- `scripts/browser-matrix.test.mjs`: matrix completeness and Playwright configuration checks.
- `.github/workflows/ci.yml`: clean Node 24 quality gate and engine-specific browser jobs/artifacts.
- `.github/workflows/release.yml`: protected verification and publication ordering.
- `scripts/verify-release-readiness.mjs`: side-effect-free local release gate orchestrator.
- `docs/releases/v5-alpha-readiness.md`: deterministic automated evidence and manual sign-off checklist.
- `docs/RELEASING.md`, `CHANGELOG.md`, and `package.json`: command documentation and release metadata wiring.

---

### Task 1: Make release policy semantic and testable

**Files:**

- Create: `scripts/release-policy.mjs`
- Modify: `scripts/verify-release.test.mjs`
- Modify: `.github/workflows/release.yml`
- Modify: `package.json`

**Interfaces:**

- Produces: `validateReleasePolicy({ packageJson, workflow }): readonly string[]`
- Consumes: parsed `package.json` data and the release workflow source.
- Later tasks consume the `test:release` command only; they do not import workflow internals.

- [ ] **Step 1: Write failing semantic policy tests**

Replace regex-only acceptance with mutation tests that call the validator. Include these assertions:

```js
import { validateReleasePolicy } from './release-policy.mjs'

test('accepts the checked release policy', () => {
  assert.deepEqual(validateReleasePolicy({ packageJson, workflow }), [])
})

test('rejects a prerelease sent to latest', () => {
  assert.ok(
    validateReleasePolicy({ packageJson, workflow: withoutStableGuard }).some(
      (error) => error.includes('latest must reject prerelease versions'),
    ),
  )
})

test('requires registry verification before GitHub release creation', () => {
  assert.ok(
    validateReleasePolicy({ packageJson, workflow: releaseBeforeVerify }).some(
      (error) =>
        error.includes('registry verification must precede release creation'),
    ),
  )
})
```

Cover manual dispatch, the protected `npm` environment, OIDC, absence of long-lived npm tokens, exact package-version matching, an unused-version registry check, `next` prerelease enforcement, `latest` stable enforcement, the `main` restriction for `latest`, provenance/public access, verify-before-publish ordering, registry-check-before-release ordering, and immutable version failure.

- [ ] **Step 2: Run the focused tests and confirm the intended failure**

Run: `node --test scripts/verify-release.test.mjs`

Expected: FAIL because `release-policy.mjs` and semantic validation do not exist.

- [ ] **Step 3: Implement the pure policy validator**

Implement a validator that returns all detected errors in deterministic order:

```js
export function validateReleasePolicy({ packageJson, workflow }) {
  const errors = []
  const requirePattern = (pattern, message) => {
    if (!pattern.test(workflow)) errors.push(message)
  }

  requirePattern(/workflow_dispatch:/, 'release workflow must be manual')
  requirePattern(/environment: npm/, 'publish job must use the npm environment')
  requirePattern(/id-token: write/, 'publish job must request OIDC')
  if (/NODE_AUTH_TOKEN|NPM_TOKEN/.test(workflow)) {
    errors.push('release workflow must not use long-lived npm tokens')
  }
  requirePattern(
    /test "\$PACKAGE_VERSION" = "\$VERSION"/,
    'requested version must match package.json',
  )
  requirePattern(
    /npm view "\$NAME@\$VERSION" version/,
    'published versions must be immutable',
  )
  requirePattern(
    /test "\$GITHUB_REF_NAME" = "main"/,
    'latest releases must come from main',
  )
  requirePattern(
    /npm publish --access public --tag "\$CHANNEL"/,
    'publish must use the requested protected channel',
  )
  const publishIndex = workflow.indexOf('npm publish --access public')
  const registryIndex = workflow.lastIndexOf(
    'npm view "$NAME@$CHANNEL" version',
  )
  const releaseIndex = workflow.indexOf('gh release create')
  if (publishIndex < 0 || registryIndex < publishIndex) {
    errors.push('registry verification must follow publication')
  }
  if (releaseIndex < registryIndex) {
    errors.push('registry verification must precede release creation')
  }
  if (packageJson.publishConfig?.access !== 'public') {
    errors.push('package must publish with public access')
  }
  if (packageJson.publishConfig?.provenance !== true) {
    errors.push('package must publish with provenance')
  }
  return errors
}
```

Strengthen `.github/workflows/release.yml` only where mutation tests expose a real missing guard. Keep all release actions behind `workflow_dispatch` and the protected environment.

- [ ] **Step 4: Run release tests and the static checks**

Run:

```bash
node --test scripts/verify-release.test.mjs
npm run lint
npm run typecheck
```

Expected: all commands PASS.

- [ ] **Step 5: Commit the policy gate**

```bash
git add scripts/release-policy.mjs scripts/verify-release.test.mjs .github/workflows/release.yml package.json
git commit -m "test: harden version 5 release policy"
```

---

### Task 2: Complete the public TypeScript contract

**Files:**

- Modify: `test/types/public-api.tsx`
- Modify: `test/package/consumer-types.ts`
- Create: `test/package/tsconfig.json`
- Modify: `test/package/verify-package.mjs`

**Interfaces:**

- Consumes: declarations produced by `npm run build:dist` and installed from the packed artifact.
- Produces: a strict consumer compile whose module resolution can see only the temporary consumer and installed tarball.

- [ ] **Step 1: Add missing positive and negative type assertions**

Extend `test/types/public-api.tsx` and the packed `consumer-types.ts` with adjacent valid/invalid pairs. The packed fixture must import every public value and type from the package name, including all primitive prop types and `BottomSheetProps`.

Representative assertions:

```tsx
const reason: OpenChangeReason = 'drag'
const fraction: SnapPointValue = 0.5
const pixels: SnapPointValue = '320px'
const percent: SnapPointValue = '75%'
const content: SnapPointValue = 'content'

const rootRef = createRef<HTMLDivElement>()
const triggerRef = createRef<HTMLButtonElement>()
const titleRef = createRef<HTMLHeadingElement>()

// @ts-expect-error Unitless strings are not snap-point values.
const invalidUnit: SnapPointValue = '320'
// @ts-expect-error Removed v4 lifecycle props are not supported.
const removedLifecycle = <BottomSheet title="Title" onSpringStart={() => {}} />
// @ts-expect-error Root callbacks receive a boolean and details object.
const invalidCallback: SheetRootProps = {
  children: null,
  onOpenChange(value: string) {},
}
// @ts-expect-error Trigger refs resolve to buttons.
const invalidRef = <Sheet.Trigger ref={rootRef}>Open</Sheet.Trigger>
```

Cover controlled/uncontrolled state, callback details, all reasons, all snap forms, required snap IDs, native DOM props, `asChild`, portal containers, primitive refs, convenience composition, required `BottomSheet` title, invalid callbacks, invalid refs, invalid snap values, and representative removed v4 props.

- [ ] **Step 2: Prove the packed fixture is not currently complete**

Temporarily run the expanded fixture before copying its new React compiler configuration:

Run: `npm run build:dist && npm run test:package`

Expected: FAIL compiling the packed JSX/type fixture because the verifier does not yet install/copy its complete strict consumer project.

- [ ] **Step 3: Add a strict isolated consumer TypeScript project**

Create `test/package/tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "strict": true,
    "target": "ES2022",
    "types": ["react"]
  },
  "files": ["consumer-types.ts"]
}
```

Have the package verifier copy both files into the temporary consumer and run its locally installed compiler with `npm exec -- tsc --project tsconfig.json`. Do not use repository path aliases.

- [ ] **Step 4: Run both source and packed type contracts**

Run:

```bash
npm run typecheck
npm run build:dist
npm run test:package
```

Expected: all commands PASS, including every `@ts-expect-error` assertion.

- [ ] **Step 5: Commit the type contract**

```bash
git add test/types/public-api.tsx test/package/consumer-types.ts test/package/tsconfig.json test/package/verify-package.mjs
git commit -m "test: complete the version 5 type contract"
```

---

### Task 3: Harden packed artifact verification

**Files:**

- Modify: `test/package/verify-package.mjs`
- Modify: `test/package/consumer-esm.mjs`
- Modify: `test/package/consumer-cjs.cjs`
- Create: `test/package/verify-package.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Produces: `validatePackedFiles(paths: readonly string[]): readonly string[]` and `verifyInstalledMetadata(metadata): readonly string[]` exported from a side-effect-free helper module colocated with the verifier.
- Consumes: `npm pack --json` output and the installed package's public metadata.

- [ ] **Step 1: Write failing tarball and metadata tests**

Create mutation tests that reject source, tests, cache files, maps outside `dist`, TypeScript build metadata, website files, and undeclared top-level files. Verify the exact required file set includes `LICENSE`, `README.md`, `package.json`, JavaScript, declarations, sourcemaps, and all four CSS exports.

```js
test('rejects repository source in the tarball', () => {
  assert.deepEqual(validatePackedFiles([...validPaths, 'src/index.ts']), [
    'packed package contains unexpected file: src/index.ts',
  ])
})

test('rejects incorrect installed peer metadata', () => {
  assert.ok(
    verifyInstalledMetadata({
      ...validMetadata,
      peerDependencies: { react: '^18' },
    }).includes('installed package must require React 19'),
  )
})
```

- [ ] **Step 2: Run focused tests and confirm missing validators fail**

Run: `node --test test/package/verify-package.test.mjs`

Expected: FAIL because the pure validators do not exist.

- [ ] **Step 3: Implement allowlist and installed-metadata validation**

Move pure checks into `test/package/package-contract.mjs`. Keep `verify-package.mjs` responsible only for orchestration. Validate the installed package name, version, engines, React peers, exports, side effects, runtime dependency names, and publish configuration by resolving its installed `package.json`.

Update both runtime consumers to assert `Sheet.Root` and `BottomSheet` exports and resolve all four CSS entry points. Ensure cleanup remains in `finally`, including failures during packing or installation.

- [ ] **Step 4: Run unit and end-to-end package verification**

Run:

```bash
node --test test/package/verify-package.test.mjs
npm run build:dist
npm run test:package
npm pack --dry-run
```

Expected: all commands PASS; the dry-run file list contains only approved package files.

- [ ] **Step 5: Commit the artifact gate**

```bash
git add test/package package.json
git commit -m "test: verify the packed release artifact"
```

---

### Task 4: Make cross-browser release coverage explicit

**Files:**

- Create: `scripts/browser-matrix.mjs`
- Create: `scripts/browser-matrix.test.mjs`
- Modify: `e2e/bottom-sheet.spec.ts`
- Modify: `e2e/sheet-interactions.spec.ts`
- Modify: `e2e/website/recipes.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `playwright.website.config.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `package.json`

**Interfaces:**

- Produces: `validateBrowserMatrix({ libraryProjects, websiteProjects, scenarios }): readonly string[]`.
- Consumes: explicit release scenario keys exported by the matrix module and Playwright project names.

- [ ] **Step 1: Write the failing matrix completeness test**

Define required scenario keys:

```js
export const releaseScenarios = [
  'modal-focus-isolation',
  'non-modal-interaction',
  'mouse-drag',
  'touch-drag',
  'flick-settling',
  'pointer-cancellation',
  'motion-interruption',
  'nested-scroll',
  'handle-only-drag',
  'viewport-resize',
  'content-resize',
  'reduced-motion',
  'custom-portal',
  'narrow-layout',
  'website-accessibility',
] as const
```

The Node test reads both Playwright configs and an explicit scenario registry. It must fail for a missing engine or missing scenario and require Chromium, Firefox, and WebKit in both suites plus the Chromium touch project for library gestures.

- [ ] **Step 2: Run the matrix test and confirm current gaps**

Run: `node --test scripts/browser-matrix.test.mjs`

Expected: FAIL because no explicit scenario registry or validator exists; any genuinely missing scenario is listed.

- [ ] **Step 3: Implement the coverage model and focused missing scenarios**

Create a pure validator that aggregates missing projects and scenario keys. Register existing tests by stable scenario key, then add only the smallest browser tests needed to cover missing behavior. Do not duplicate a scenario per engine; Playwright project selection supplies engine coverage.

- [ ] **Step 4: Split CI browser execution by engine with diagnostics**

Use a matrix job after quality:

```yaml
strategy:
  fail-fast: false
  matrix:
    project: [chromium, firefox, webkit]
steps:
  - run: npx playwright install --with-deps ${{ matrix.project }}
  - run: npm run test:e2e -- --project=${{ matrix.project }}
  - run: npm run test:website:e2e -- --project=${{ matrix.project }}
  - if: failure()
    uses: actions/upload-artifact@v7
    with:
      name: playwright-${{ matrix.project }}
      path: |
        playwright-report/
        test-results/
      if-no-files-found: ignore
```

Keep the Chromium touch project in a separate library step because its project name differs from the browser executable. Apply the same explicit supported-engine verification to the protected release workflow.

- [ ] **Step 5: Run matrix and browser verification**

Run:

```bash
node --test scripts/browser-matrix.test.mjs
npm run test:e2e
npm run test:website:e2e
```

Expected: matrix test PASS and all configured Playwright projects PASS.

- [ ] **Step 6: Commit the browser gate**

```bash
git add scripts/browser-matrix.mjs scripts/browser-matrix.test.mjs e2e playwright.config.ts playwright.website.config.ts .github/workflows/ci.yml .github/workflows/release.yml package.json
git commit -m "test: define the alpha browser matrix"
```

---

### Task 5: Compose readiness verification and maintainer sign-offs

**Files:**

- Create: `scripts/verify-release-readiness.mjs`
- Create: `scripts/verify-release-readiness.test.mjs`
- Create: `docs/releases/v5-alpha-readiness.md`
- Modify: `docs/RELEASING.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`

**Interfaces:**

- Produces: `release:check`, a side-effect-free command that runs repository, package, audit, and cross-browser policy gates in a deterministic order.
- Consumes: `check`, `test:browser-matrix`, `npm audit --omit=dev`, `npm pack --dry-run`, and the existing Playwright commands.

- [ ] **Step 1: Write failing orchestration and documentation tests**

Test the command manifest as data rather than spawning the entire suite:

```js
test('readiness checks are complete and side-effect free', () => {
  assert.deepEqual(readinessCommands, [
    ['npm', ['run', 'check']],
    ['npm', ['run', 'test:browser-matrix']],
    ['npm', ['audit', '--omit=dev']],
    ['npm', ['pack', '--dry-run']],
  ])
  assert.equal(
    readinessCommands.some(([command, args]) =>
      `${command} ${args.join(' ')}`.match(
        /publish|release create|npm dist-tag|git tag/,
      ),
    ),
    false,
  )
})
```

Add static assertions that the report lists every automated command and every manual sign-off, that none is falsely marked complete, and that release documentation requires `npm ci` before readiness verification.

- [ ] **Step 2: Run focused tests and confirm the missing command fails**

Run: `node --test scripts/verify-release-readiness.test.mjs`

Expected: FAIL because the orchestrator and readiness report do not exist.

- [ ] **Step 3: Implement a fail-fast, side-effect-free orchestrator**

Export the command list for tests and execute it only when the module is the process entry point:

```js
export const readinessCommands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:browser-matrix']],
  ['npm', ['audit', '--omit=dev']],
  ['npm', ['pack', '--dry-run']],
]
```

Use `spawnSync` with inherited stdio, stop at the first non-zero status, and return that status. Add `"release:check": "node scripts/verify-release-readiness.mjs"` to `package.json`. CI continues to perform `npm ci` as a separate clean-install step before invoking it.

- [ ] **Step 4: Write the deterministic readiness report**

Create `docs/releases/v5-alpha-readiness.md` with:

```markdown
## Automated gates

- `npm ci`
- `npm run release:check`
- `npm run test:e2e`
- `npm run test:website:e2e`

## Maintainer sign-offs required before publication

- [ ] VoiceOver on macOS or iOS
- [ ] Keyboard-only modal and non-modal operation
- [ ] iOS Safari on a physical device
- [ ] Android Chrome on a physical device
- [ ] Production domain, sitemap, social metadata, and examples
- [ ] npm trusted publisher and GitHub `npm` environment protection
```

Record that the production audit is blocking and the development audit is informational and separately triaged. Do not add dates, local paths, machine names, or check any manual box.

Update `docs/RELEASING.md` so the alpha sequence is `npm ci`, `npm run release:check`, full browser commands, preview verification, manual sign-offs, merge, explicit workflow authorization. Update the alpha changelog only for concrete readiness features added by this plan.

- [ ] **Step 5: Wire CI and protected release verification**

Have quality invoke `npm run release:check` only if that does not duplicate browser execution; browser jobs remain separate. The protected release workflow must run the same side-effect-free readiness command before entering the publish job. Add a policy test guarding this ordering.

- [ ] **Step 6: Run the complete release-candidate verification**

Run from the clean worktree:

```bash
npm ci
npm run release:check
npm run test:e2e
npm run test:website:e2e
git diff --check
```

Expected: every command PASS. Record exact test counts and artifact sizes in the pull-request report, not as mutable numbers in the checked readiness document.

- [ ] **Step 7: Scan tracked text and inspect the final diff**

Run the full development audit separately from the blocking production audit:

```bash
npm audit --json
```

Expected: record any tooling-only advisories, affected development commands, and
available upgrade path in the pull-request report. A non-zero full-audit status
does not override a successful `npm audit --omit=dev`, but every advisory must be
triaged rather than hidden.

Then inspect the worktree:

Run:

```bash
git status --short
git diff --check
git diff --stat origin/v5...HEAD
```

Expected: only planned release-readiness files are changed and no generated or temporary consumer artifacts remain.

- [ ] **Step 8: Commit the readiness boundary**

```bash
git add scripts/verify-release-readiness.mjs scripts/verify-release-readiness.test.mjs docs/releases/v5-alpha-readiness.md docs/RELEASING.md CHANGELOG.md package.json .github/workflows/ci.yml .github/workflows/release.yml
git commit -m "chore: prepare version 5 alpha verification"
```

---

## Final review and integration

- [ ] Run a whole-branch review against `docs/roadmap/v5-alpha-readiness-design.md`.
- [ ] Resolve every release-blocking finding with focused regression tests.
- [ ] Run the complete verification commands from Task 5 again after the final fix.
- [ ] Push `release/v5-alpha-readiness` and open a pull request into `v5`.
- [ ] Keep the worktree for CI and review feedback.
- [ ] Do not dispatch the Release workflow until the pull request is merged, every manual sign-off is complete, external protection is verified, and the maintainer explicitly authorizes publication.
