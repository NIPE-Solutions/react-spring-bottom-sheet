# Interactive Device Lab Implementation Plan

**Goal:** Present every recipe in a shareable phone or tablet viewport and render build-time highlighted source from the exact runnable component file.

**Architecture:** Normal pages move under a route group that owns the site chrome, while minimal same-origin embed pages use a separate route group. A client-side device lab changes URL-backed presets and animates a persistent iframe; server-only source loading and Shiki tokenization keep the displayed code accurate without shipping a highlighter.

**Tech stack:** Next.js 16 App Router/static export, React 19, TypeScript 6, Motion 13, Shiki, Vitest, Node test runner, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-09-03-device-lab-design.md`

## Global constraints

- Preserve the library's public API and package output.
- Support Node.js 24 only.
- Keep `/examples/[slug]/` and add `/examples/[slug]/embed/`, both statically generated.
- Use only `phone`/`tablet` and `portrait`/`landscape`; default to phone portrait.
- Keep the iframe mounted while device configuration changes.
- Honor `prefers-reduced-motion`.
- Read source only from allowlisted recipe files beneath `website/recipes`.
- Load TSX highlighting at build time; do not ship Shiki to the browser.
- Do not imitate a commercial editor or add decorative window controls.
- End every delivery slice with `npm run check` and the relevant browser matrix.

---

## Slice 1: Isolated embeds and canonical source

### Task 1: Separate site chrome from embedded routes

**Files:**

- Modify: `website/app/layout.tsx`
- Create: `website/app/(site)/layout.tsx`
- Move: every current route directory and `page.tsx` from `website/app/` to `website/app/(site)/`, leaving `layout.tsx` and `site.css` at the root
- Create: `website/app/(embed)/examples/[slug]/embed/page.tsx`
- Create: `website/components/RecipeEmbedPage.tsx`
- Modify: `website/components/RecipePreview.tsx`
- Modify: `website/app/(site)/examples/[slug]/page.tsx`
- Modify: `scripts/verify-website.test.mjs`
- Modify: `e2e/website/recipes.spec.ts`

**Interfaces:**

- Consumes: `recipes` and `getRecipe(slug)` from `website/recipes/registry.ts`.
- Produces: static `/examples/<slug>/embed/index.html` pages with `robots: { index: false, follow: false }`.
- Produces: `RecipePreview({ slug, title })`, initially as a persistent same-origin iframe that Task 5 enhances with device controls.

- [ ] **Step 1: Add failing static-route assertions**

Extend the website verification test to require the embedded route source and its static-parameter contract:

```js
const embedPage = readFileSync(
  new URL(
    '../website/app/(embed)/examples/[slug]/embed/page.tsx',
    import.meta.url
  ),
  'utf8'
)
assert.match(embedPage, /generateStaticParams/)
assert.match(embedPage, /index:\s*false/)
assert.match(embedPage, /follow:\s*false/)
```

- [ ] **Step 2: Run the verifier and confirm the missing-embed failure**

Run: `npm run test:website`

Expected: FAIL because no embedded recipe output exists.

- [ ] **Step 3: Move site routes behind a chrome layout**

Keep global metadata, `<html>`, `<body>`, stylesheet imports, and the body content slot in `website/app/layout.tsx`. Put the skip link, `SiteHeader`, and `SiteFooter` in `website/app/(site)/layout.tsx`:

```tsx
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="docs-skip-link" href="#content">
        Skip to content
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  )
}
```

Move existing route files without changing their resulting URLs. Keep metadata-only root files such as `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` at `website/app/`. Update relative imports affected by the additional route-group directory and update source-contract tests that intentionally address the moved legal pages.

- [ ] **Step 4: Add the embedded recipe page**

Export `generateStaticParams`, `dynamicParams = false`, and recipe-specific metadata. Render a minimal main element:

```tsx
export default async function EmbedPage({ params }: PageProps) {
  const recipe = getRecipe((await params).slug)
  if (!recipe) notFound()
  return <RecipeEmbedPage title={recipe.title} component={recipe.component} />
}
```

`RecipeEmbedPage` renders the component inside `<main id="content" className="docs-recipe-embed">` with a compact neutral application surface and no site chrome.

- [ ] **Step 5: Point the recipe preview at the embedded route**

Change `RecipePreview` to accept `slug` and `title`, then render an iframe with `src={`/examples/${slug}/embed/`}` and `title={`${title} interactive preview`}`. Update the recipe page call site so recipes no longer mount directly in the parent document.

- [ ] **Step 6: Verify routes and static output**

Add a `recipeFrame(page)` helper returning `page.frameLocator('[title$="interactive preview"]')`, then migrate every existing recipe interaction in `e2e/website/recipes.spec.ts` to locate triggers, dialogs, state, and custom portal bounds within that frame. Keep documentation-page source and narrow-layout assertions on the parent page.

Run: `npm run test:website && npm run build:website`

Expected: PASS, with all recipe and embed HTML files present.

- [ ] **Step 7: Commit Task 1**

```bash
git add website/app website/components/RecipeEmbedPage.tsx website/components/RecipePreview.tsx scripts/verify-website.test.mjs e2e/website/recipes.spec.ts
git commit -m "feat(docs): isolate recipe preview routes"
```

### Task 2: Make recipe files the canonical displayed source

**Files:**

- Modify: `website/recipes/types.ts`
- Modify: `website/recipes/registry.ts`
- Create: `website/recipes/source.ts`
- Create: `website/recipes/source.test.ts`
- Modify: `website/app/(site)/examples/[slug]/page.tsx`
- Delete: `website/recipes/*/source.ts`

**Interfaces:**

- Produces: `sourceFile: RecipeSourceFile` on `RecipeDefinition`.
- Produces: `loadRecipeSource(sourceFile: RecipeSourceFile): Promise<{ filename: string; source: string }>` as a server-only function.
- Security invariant: resolved files must remain inside the canonical `website/recipes` directory and end in `.tsx`.

- [ ] **Step 1: Write failing loader tests**

Cover a valid registered source, a missing source, a path traversal, and a non-TSX extension:

```ts
await expect(loadRecipeSource('basic/BasicSheet.tsx')).resolves.toMatchObject({
  filename: 'BasicSheet.tsx',
})
await expect(
  loadRecipeSource('../package.json' as RecipeSourceFile)
).rejects.toThrow('Recipe source must remain inside website/recipes')
```

Also assert the returned source equals `readFile` output byte-for-byte.

- [ ] **Step 2: Confirm the tests fail before implementation**

Run: `npx vitest run website/recipes/source.test.ts`

Expected: FAIL because `sourceFile` and `loadRecipeSource` do not exist.

- [ ] **Step 3: Introduce typed, allowlisted paths**

Define the union from the registry's known filenames rather than accepting arbitrary strings:

```ts
export type RecipeSourceFile =
  | 'basic/BasicSheet.tsx'
  | 'controlled/ControlledSheet.tsx'
  | 'snap-points/SnapPointSheet.tsx'
  | 'content-height/ContentHeightSheet.tsx'
  | 'scrolling/ScrollingSheet.tsx'
  | 'form/FormSheet.tsx'
  | 'custom-portal/CustomPortalSheet.tsx'
  | 'non-modal/NonModalSheet.tsx'
  | 'reduced-motion/ReducedMotionSheet.tsx'
  | 'custom-theme/CustomThemeSheet.tsx'
  | 'dark-theme/DarkThemeSheet.tsx'
  | 'confirmation/ConfirmationSheet.tsx'
```

Replace each `source` registry field with its matching `sourceFile`. Remove all imports from the duplicated source modules.

- [ ] **Step 4: Implement server-only source loading**

Use `fileURLToPath`, `resolve`, `relative`, and `readFile` from Node modules so the loader can only execute during the server build. Reject absolute relatives, `..` prefixes, and non-`.tsx` extensions before reading. Return `basename(absolutePath)` and the unmodified UTF-8 source.

- [ ] **Step 5: Load source in the recipe server page**

Resolve the registered file before rendering `RecipeSource`:

```tsx
const source = await loadRecipeSource(recipe.sourceFile)
return <RecipeSource filename={source.filename} source={source.source} />
```

- [ ] **Step 6: Remove duplicated source modules and run focused checks**

Run: `npx vitest run website/recipes/source.test.ts website/recipes/registry.test.ts && npm run typecheck && npm run build:website`

Expected: PASS and no import or output references to the deleted source modules.

- [ ] **Step 7: Commit Task 2**

```bash
git add website/recipes website/app/'(site)'/examples/'[slug]'/page.tsx
git commit -m "refactor(docs): derive recipe source from components"
```

### Task 3: Gate Slice 1

- [ ] **Step 1: Run the repository gate**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 2: Run recipe pages in Chromium and Firefox**

Run: `npx playwright test --config playwright.website.config.ts e2e/website/recipes.spec.ts --project=chromium --project=firefox`

Expected: PASS.

- [ ] **Step 3: Record the slice checkpoint**

```bash
git commit --allow-empty -m "test(docs): verify isolated recipe embeds"
```

---

## Slice 2: URL-backed device lab

### Task 4: Add typed device presets and URL parsing

**Files:**

- Create: `website/components/device-lab/device-config.ts`
- Create: `website/components/device-lab/device-config.test.ts`

**Interfaces:**

- Produces: `Device = 'phone' | 'tablet'`.
- Produces: `Orientation = 'portrait' | 'landscape'`.
- Produces: `DeviceSelection`, `DevicePreset`, `DEFAULT_DEVICE_SELECTION`, `getDevicePreset(selection)`, `parseDeviceSelection(searchParams)`, and `toDeviceSearchParams(selection)`.

- [ ] **Step 1: Write the table-driven failing tests**

Assert all four logical dimensions, the default, valid query parsing, invalid-value fallback, and stable serialization:

```ts
expect(
  getDevicePreset({ device: 'phone', orientation: 'portrait' })
).toMatchObject({
  width: 390,
  height: 780,
})
expect(
  parseDeviceSelection(
    new URLSearchParams('device=watch&orientation=upside-down')
  )
).toEqual(DEFAULT_DEVICE_SELECTION)
expect(
  toDeviceSearchParams({
    device: 'tablet',
    orientation: 'landscape',
  }).toString()
).toBe('device=tablet&orientation=landscape')
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run website/components/device-lab/device-config.test.ts`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement immutable preset data and pure helpers**

Use the exact dimensions from the specification and return new `URLSearchParams` instances. Do not accept numeric dimensions or preserve invalid device keys.

- [ ] **Step 4: Run and commit**

Run: `npx vitest run website/components/device-lab/device-config.test.ts`

Expected: PASS.

```bash
git add website/components/device-lab
git commit -m "feat(docs): define device preview presets"
```

### Task 5: Build the persistent iframe controller

**Files:**

- Create: `website/components/device-lab/DeviceLab.tsx`
- Create: `website/components/device-lab/DeviceControls.tsx`
- Create: `website/components/device-lab/DeviceFrame.tsx`
- Create: `website/components/device-lab/RecipeEmbed.tsx`
- Create: `website/components/device-lab/use-scaled-frame.ts`
- Create: `website/components/device-lab/use-scaled-frame.test.tsx`
- Modify: `website/components/RecipePreview.tsx`
- Modify: `website/app/(site)/examples/[slug]/page.tsx`

**Interfaces:**

- `DeviceLabProps = { slug: string; title: string }`.
- `RecipeEmbedProps = { slug: string; title: string; onReady(): void; onFailure(): void }`.
- The iframe `src` is always `/examples/${slug}/embed/`; device state never appears in it.

- [ ] **Step 1: Write failing scale and identity tests**

For the scaling hook, assert `scale = min(1, availableWidth / outerWidth)` and the scaled stage height. In a component test, change all four control combinations and assert the same iframe DOM node and `src` remain present.

- [ ] **Step 2: Confirm focused failures**

Run: `npx vitest run website/components/device-lab/use-scaled-frame.test.tsx`

Expected: FAIL because the hook and device components do not exist.

- [ ] **Step 3: Implement semantic controls and URL updates**

Render two labelled groups of buttons. Each button has visible text and `aria-pressed`. Use `useSearchParams`, `usePathname`, and `useRouter` to update only `device` and `orientation`, preserve unrelated parameters, and avoid navigation when the requested state is already active. Invalid values trigger `router.replace` with the normalized phone-portrait state; user control changes use `router.push` so browser history remains meaningful.

Wrap `DeviceLab` in a `Suspense` boundary whose fallback renders the phone-portrait frame. This keeps the page compatible with static export while query state is resolved in the client. Reconcile back/forward changes from `useSearchParams` without assigning a changing React `key` to the iframe.

- [ ] **Step 4: Implement proportional frame scaling**

Observe the available stage width with `ResizeObserver`. Give the iframe its exact logical pixel width and height, then transform the complete device frame by the computed scale. Set the outer stage height to the scaled frame height so later content remains in normal flow.

- [ ] **Step 5: Implement loading and failure states**

Keep the iframe in place while loading. Mark ready on `load`. Start a bounded timeout that reveals a textual fallback and direct `/examples/<slug>/embed/` link without changing the iframe `src`; clear the timer after load and on unmount.

- [ ] **Step 6: Replace the direct recipe preview**

Replace `RecipePreview`'s initial iframe wrapper with `DeviceLab`. Its `slug` and `title` interface remains unchanged, and the embedded route remains the only preview owner.

- [ ] **Step 7: Run focused checks and commit**

Run: `npx vitest run website/components/device-lab && npm run typecheck && npm run build:website`

Expected: PASS.

```bash
git add website/components/device-lab website/components/RecipePreview.tsx website/app/'(site)'/examples/'[slug]'/page.tsx
git commit -m "feat(docs): add responsive device lab"
```

### Task 6: Style and animate the device lab

**Files:**

- Modify: `website/app/site.css`
- Modify: `e2e/website/recipes.spec.ts`

**Interfaces:**

- CSS custom properties on the frame: `--device-width`, `--device-height`, `--device-scale`, `--device-radius`.
- Test identifiers: `data-device`, `data-orientation`, and `data-preview-ready`; no test-only behavioral branches.

- [ ] **Step 1: Add failing browser assertions**

Cover phone portrait defaults, tablet landscape URL restoration, visible pressed states, logical iframe dimensions, browser back/forward, and iframe identity while a basic sheet remains open. Capture the iframe element handle before changing orientation and assert the same embedded document marker remains afterward.

- [ ] **Step 2: Run the focused Chromium test and confirm failure**

Run: `npx playwright test --config playwright.website.config.ts e2e/website/recipes.spec.ts --project=chromium --grep "device lab"`

Expected: FAIL on absent controls or dimensions.

- [ ] **Step 3: Add restrained frame styling**

Remove the recipe-stage grid. Add a neutral stage, one-pixel bezel, subtle shadow, responsive control wrapping, readable viewport metadata, and device-specific radii. Keep hardware detail presentational. Ensure the page has no horizontal overflow from 320px through 1440px.

- [ ] **Step 4: Add motion and reduced-motion behavior**

Animate only user-triggered changes to dimensions, radius, bezel, and reserved stage height. Use Motion's existing dependency or CSS interpolation where it preserves a stable iframe node. Under `prefers-reduced-motion: reduce`, set transition duration to zero and disable transform interpolation.

- [ ] **Step 5: Pass browser and accessibility checks**

Run:

```bash
npx playwright test --config playwright.website.config.ts e2e/website/recipes.spec.ts --project=chromium --project=firefox
```

Expected: PASS, including axe scans and reduced-motion assertions.

- [ ] **Step 6: Commit Task 6**

```bash
git add website/app/site.css e2e/website/recipes.spec.ts
git commit -m "style(docs): animate device preview states"
```

### Task 7: Gate Slice 2

- [ ] **Step 1: Run repository and browser gates**

Run:

```bash
npm run check
npm run test:website:e2e -- --project=chromium --project=firefox
```

Expected: both commands PASS.

- [ ] **Step 2: Record the slice checkpoint**

```bash
git commit --allow-empty -m "test(docs): verify device lab behavior"
```

---

## Slice 3: Project-specific highlighted source

### Task 8: Add server-rendered Shiki tokenization

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `website/components/source-code/highlighter.ts`
- Create: `website/components/source-code/highlighter.test.ts`
- Create: `website/components/source-code/HighlightedCode.tsx`
- Create: `website/components/source-code/CopySourceButton.tsx`
- Modify: `website/components/RecipeSource.tsx`

**Interfaces:**

- Produces: `highlightTsx(source: string): Promise<HighlightedLine[]>`.
- `HighlightedLine = readonly HighlightedToken[]`.
- `HighlightedToken = { content: string; color: string; fontStyle?: number }`.
- `RecipeSourceProps = { filename: string; source: string }`.

- [ ] **Step 1: Install Shiki as build-only infrastructure**

Run: `npm install --save-dev shiki`

Expected: only manifest and lockfile dependency changes.

- [ ] **Step 2: Write failing tokenization tests**

Assert deterministic line boundaries, preserved whitespace/text, distinct comment/string/keyword colors, and no HTML input execution:

```ts
const lines = await highlightTsx('const label = "Sheet"\n// note')
expect(
  lines.map((line) => line.map((token) => token.content).join('')).join('\n')
).toBe('const label = "Sheet"\n// note')
expect(new Set(lines.flat().map((token) => token.color)).size).toBeGreaterThan(
  2
)
```

- [ ] **Step 3: Confirm the test fails**

Run: `npx vitest run website/components/source-code/highlighter.test.ts`

Expected: FAIL because the highlighter is missing.

- [ ] **Step 4: Implement one long-lived TSX highlighter**

Create a module-level promise from `createHighlighter` that loads only `langTsx` and a project theme. Derive foreground, comment, string, constant, keyword, function, type, and punctuation colors from the site's established palette. Use `codeToTokens`; do not emit or inject raw highlighted HTML.

- [ ] **Step 5: Split server rendering from copy interaction**

Make `RecipeSource` an async server component. Render line numbers with `aria-hidden="true"` and token spans with inline Shiki colors. Keep `CopySourceButton` as a small client component using Clipboard API plus the existing selection fallback. The scrollable `<pre>` remains keyboard focusable and has an accessible label containing the filename.

- [ ] **Step 6: Run focused tests and verify the client bundle boundary**

Run: `npx vitest run website/components/source-code/highlighter.test.ts && npm run typecheck && npm run build:website`

Expected: PASS. Inspect the static build output with:

```bash
rg -n 'data-code-token' website/out/examples/basic/index.html
if rg -n 'source\.tsx|text\.html\.basic|onig\.wasm' website/out/_next/static; then exit 1; fi
```

The first command must find rendered tokens; the guarded search must find no Shiki grammar or WebAssembly payload in client chunks.

- [ ] **Step 7: Commit Task 8**

```bash
git add package.json package-lock.json website/components/RecipeSource.tsx website/components/source-code
git commit -m "feat(docs): highlight canonical recipe source"
```

### Task 9: Finish source layout and end-to-end coverage

**Files:**

- Modify: `website/app/site.css`
- Modify: `e2e/website/recipes.spec.ts`
- Modify: `scripts/check-website-css.test.mjs`

**Interfaces:**

- Source line elements expose `data-line` for stable styling and inspection.
- Line-number columns are excluded from copying through `user-select: none` and `aria-hidden`.

- [ ] **Step 1: Add failing presentation and copy tests**

Assert the filename, multiple colored tokens, sequential line numbers, keyboard-focusable code scroller, successful copy status, and copied text equality with `readFileSync('website/recipes/basic/BasicSheet.tsx', 'utf8')` after excluding elements marked `aria-hidden="true"`.

- [ ] **Step 2: Confirm the focused test fails**

Run: `npx playwright test --config playwright.website.config.ts e2e/website/recipes.spec.ts --project=chromium --grep "highlighted source"`

Expected: FAIL on missing source presentation behavior.

- [ ] **Step 3: Add the project-specific source styles**

Use a deep neutral surface, clear filename label, one bordered toolbar, tabular line numbers, comfortable code leading, visible focus outline, and horizontal scrolling. Do not add fake tabs, traffic-light controls, or editor branding. Meet WCAG AA contrast for every token against the code background.

- [ ] **Step 4: Add responsive split/stack behavior**

At widths where both columns retain useful reading space, place the lab and source in a balanced layout container. Below that threshold, retain document order and stack source after guidance. Add CSS contract assertions that prevent fixed-width overflow and ensure compact controls wrap.

- [ ] **Step 5: Run the complete website matrix**

Run:

```bash
npm run test:website
npm run build:website
npm run test:website:e2e -- --project=chromium --project=firefox --project=webkit
```

Expected: PASS across static contracts, build, accessibility, device configurations, and source interactions.

- [ ] **Step 6: Commit Task 9**

```bash
git add website/app/site.css e2e/website/recipes.spec.ts scripts/check-website-css.test.mjs
git commit -m "style(docs): refine recipe source presentation"
```

### Task 10: Final release-quality gate

- [ ] **Step 1: Run the complete repository check from a clean tree**

Run: `npm run check`

Expected: PASS with no changed generated artifacts.

- [ ] **Step 2: Run every website browser project**

Run: `npm run test:website:e2e`

Expected: PASS for Chromium, Firefox, WebKit, and configured touch coverage.

- [ ] **Step 3: Inspect the production artifact**

Serve `website/out`, open one ordinary recipe and its embed directly, and verify that headers appear only on the ordinary page, all four device URLs load, an open sheet survives orientation change, source copies exactly, and no page introduces horizontal scrolling.

- [ ] **Step 4: Confirm repository state**

Run: `git status --short && git log --oneline --decorate -12`

Expected: an empty status and focused commits matching the tasks above.
