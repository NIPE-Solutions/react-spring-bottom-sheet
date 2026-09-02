# Version 5 documentation implementation plan

## Goal

Build a rich, evidence-led documentation website with a live homepage, tested recipe library, complete reference, and maintainable content architecture without changing the package API.

## Architecture

A typed registry drives static routes, navigation, metadata, and search. First-class recipe modules provide the same implementation to live previews and browser tests. Small presentation components render the shell and structured reference while long-form guidance remains independently editable.

## Technology

Next.js static export, React 19, TypeScript, CSS layers, Node test runner, Vitest, and Playwright.

## Design reference

`docs/roadmap/v5-documentation-design.md`

## Global constraints

- Keep the version 5 package API unchanged.
- Import recipes only through `@library`, the public package alias.
- Prefix site classes and custom properties with `docs-` or `--docs-`.
- Keep library-owned selectors and variables in the `rsbs` namespace.
- Preserve static export and Vercel deployment behavior.
- Support keyboard use, reduced motion, and a 320 CSS pixel viewport.
- Back every published size, browser, and coverage claim with a reproducible check.
- Keep every pull request independently deployable and reviewable.

## Slice 1: Design foundation

**Files**

- Modify: `website/app/site.css`
- Modify: `website/app/layout.tsx`
- Create: `website/components/SiteHeader.tsx`
- Create: `website/components/SiteFooter.tsx`
- Create: `e2e/website/layout.spec.ts`
- Modify: `scripts/verify-website.test.mjs`

**Produces**

- `SiteHeader` and `SiteFooter` presentation boundaries
- `--docs-*` token system
- Responsive page shell and focus behavior

**Steps**

- [ ] Add failing static checks that reject unprefixed site custom properties and require the primary landmarks.
- [ ] Add browser assertions for skip-link behavior, visible focus, header navigation, and 320-pixel overflow.
- [ ] Extract the header and footer without changing route behavior.
- [ ] Implement the motion-instrument token system and responsive shell in the `site.components` CSS layer.
- [ ] Verify `npm run test:website`, `npm run lint`, and `npm run test:website:e2e`.
- [ ] Commit the independently deployable foundation.

The namespace check should enforce the following boundary:

```js
assert.doesNotMatch(siteCss, /(?<!-)--(?!docs-)[a-z][\w-]*\s*:/)
assert.match(siteCss, /--docs-canvas:\s*#f5f6f8/)
assert.match(layout, /<header[\s>]/)
assert.match(layout, /<footer[\s>]/)
```

## Slice 2: Typed content registry and documentation shell

**Files**

- Replace: `website/content/docs.mjs`
- Replace: `website/content/docs.d.ts`
- Create: `website/content/navigation.ts`
- Create: `website/content/types.ts`
- Create: `website/components/DocsShell.tsx`
- Create: `website/components/DocsNavigation.tsx`
- Create: `website/components/TableOfContents.tsx`
- Create: `website/components/PageNavigation.tsx`
- Modify: `website/app/docs/[slug]/page.tsx`
- Create: `website/content/navigation.test.ts`
- Modify: `e2e/website/docs.spec.ts`

**Produces**

```ts
type DocGroupId = 'learn' | 'reference' | 'project'

interface DocPageMeta {
  slug: string
  title: string
  description: string
  group: DocGroupId
  order: number
}

interface DocHeading {
  id: string
  label: string
  depth: 2 | 3
}
```

**Steps**

- [ ] Write unit tests for unique slugs, contiguous ordering within groups, stable previous/next resolution, and unique heading identifiers.
- [ ] Replace the untyped manifest with `DocPageMeta` records and navigation helpers.
- [ ] Build the documentation shell from section navigation, content, on-page headings, and previous/next links.
- [ ] Add a compact mobile navigation control and ensure it does not replace ordinary links.
- [ ] Derive static paths and metadata from the typed registry.
- [ ] Verify direct loading of every registered route, keyboard navigation, and mobile layout.
- [ ] Commit the complete documentation shell.

## Slice 3: Shared recipe contract and core recipes

**Files**

- Create: `website/recipes/types.ts`
- Create: `website/recipes/registry.ts`
- Create: `website/recipes/basic/BasicSheet.tsx`
- Create: `website/recipes/basic/source.ts`
- Create: `website/recipes/controlled/ControlledSheet.tsx`
- Create: `website/recipes/controlled/source.ts`
- Create: `website/recipes/snap-points/SnapPointSheet.tsx`
- Create: `website/recipes/snap-points/source.ts`
- Create: `website/components/RecipePreview.tsx`
- Create: `website/components/RecipeSource.tsx`
- Create: `website/app/examples/[slug]/page.tsx`
- Modify: `website/app/examples/page.tsx`
- Create: `website/recipes/registry.test.ts`
- Create: `e2e/website/recipes.spec.ts`

**Produces**

```ts
interface RecipeDefinition {
  slug: string
  title: string
  summary: string
  component: React.ComponentType
  source: string
  relatedDocs: readonly string[]
  accessibility: readonly string[]
}
```

**Steps**

- [ ] Write registry tests for unique slugs, non-empty source, valid documentation links, and accessible notes.
- [ ] Implement the recipe type and lookup helpers.
- [ ] Move the basic, controlled-state, and named-snap-point demonstrations into focused recipe modules.
- [ ] Render each recipe from one definition on its own statically generated route.
- [ ] Add keyboard-accessible source display and copy behavior with a non-JavaScript fallback.
- [ ] Make Playwright consume stable recipe URLs and assert each defining behavior.
- [ ] Verify recipes import `Sheet` only from `@library`.
- [ ] Commit the initial executable recipe system.

## Slice 4: Evidence-led homepage

**Files**

- Replace: `website/app/page.tsx`
- Replace: `website/components/LiveSheet.tsx`
- Create: `website/components/Evidence.tsx`
- Create: `website/components/QuickStart.tsx`
- Create: `website/components/RecipeLinks.tsx`
- Create: `website/content/evidence.ts`
- Create: `scripts/write-website-evidence.mjs`
- Create: `scripts/write-website-evidence.test.mjs`
- Modify: `package.json`
- Create: `e2e/website/home.spec.ts`

**Produces**

```ts
interface BuildEvidence {
  version: string
  moduleGzipBytes: number
  browserEngines: readonly ['Chromium', 'Firefox', 'WebKit']
  reactRange: string
}
```

**Steps**

- [ ] Test evidence generation against a temporary build artifact and package metadata.
- [ ] Generate the current version, gzip size, React range, and tested browser names during the website build.
- [ ] Rebuild the hero around a real sheet with compact and expanded destinations.
- [ ] Add concise positioning, installation, evidence, and representative recipe links.
- [ ] Ensure the hero supports pointer, touch, keyboard, and reduced-motion operation.
- [ ] Add browser assertions for open, drag, snap, close animation, focus restoration, and evidence rendering.
- [ ] Verify homepage metadata, static output, and layout at desktop and mobile sizes.
- [ ] Commit the complete homepage.

## Slice 5: Learning content and production recipes

**Files**

- Create: `website/content/learn/*.tsx`
- Create: `website/recipes/content-height/*`
- Create: `website/recipes/scrolling/*`
- Create: `website/recipes/form/*`
- Create: `website/recipes/custom-portal/*`
- Create: `website/recipes/non-modal/*`
- Create: `website/recipes/reduced-motion/*`
- Create: `website/recipes/confirmation/*`
- Modify: `website/recipes/registry.ts`
- Modify: `e2e/website/recipes.spec.ts`

**Produces**

- Complete Learn section from installation through troubleshooting
- Nine production-oriented, runnable recipes

**Steps**

- [ ] Add registry entries and failing behavior tests for each new recipe.
- [ ] Write the installation and first-sheet guides with a type-checked minimal example.
- [ ] Write state, anatomy, snap-point, gesture, scrolling, accessibility, and troubleshooting guides.
- [ ] Implement each recipe as a small public-API consumer with visible source.
- [ ] Add explicit keyboard and screen-reader notes to every recipe.
- [ ] Cross-link guides, recipes, and reference entries.
- [ ] Verify every code block either maps to a type fixture or a runnable recipe.
- [ ] Commit the expanded learning experience.

## Slice 6: Styling system and complete-theme recipes

**Files**

- Create: `website/content/learn/styling.tsx`
- Create: `website/content/reference/styles.tsx`
- Create: `website/recipes/custom-theme/CustomThemeSheet.tsx`
- Create: `website/recipes/custom-theme/theme.css`
- Create: `website/recipes/dark-theme/DarkThemeSheet.tsx`
- Create: `website/recipes/dark-theme/theme.css`
- Modify: `scripts/check-css-namespace.mjs`
- Modify: `e2e/website/recipes.spec.ts`

**Produces**

- Documented separation of mechanics, tokens, and visual theme
- Two complete restyles that do not intersect with site classes

**Steps**

- [ ] Add failing checks for `docs-`, `rsbs`, and recipe-theme namespace boundaries.
- [ ] Document all stylesheet entry points, stable selectors, data attributes, and custom properties.
- [ ] Implement a complete custom theme using `core.css` without `theme.css`.
- [ ] Implement a dark theme and verify forced-colors and reduced-motion behavior.
- [ ] Test that site CSS cannot style recipe internals and recipe CSS cannot style the site shell.
- [ ] Add copyable stylesheet source next to each live theme.
- [ ] Commit the styling guide and theme recipes.

## Slice 7: Public API reference

**Files**

- Create: `website/content/reference/public-api.ts`
- Create: `website/content/reference/behavior.tsx`
- Create: `website/components/ApiTable.tsx`
- Create: `scripts/extract-public-api.mjs`
- Create: `scripts/extract-public-api.test.mjs`
- Create: `website/generated/public-api.json`
- Modify: `scripts/verify-website.test.mjs`
- Modify: `package.json`

**Produces**

```ts
interface PublicApiEntry {
  name: string
  kind: 'component' | 'type' | 'function'
  signature: string
  description: string
  source: string
}
```

**Steps**

- [ ] Write extraction tests for components, exported types, signatures, and deterministic output.
- [ ] Extract the public surface from the declaration build into checked JSON.
- [ ] Add a validation failure when an exported name lacks reference content.
- [ ] Render accessible API tables with useful narrow-screen behavior.
- [ ] Document props, callbacks, reasons, CSS contracts, and behavioral guarantees.
- [ ] Add source links pinned to the documented release version.
- [ ] Verify the generated manifest is unchanged after a clean regeneration.
- [ ] Commit the complete reference.

## Slice 8: Search and quality gates

**Files**

- Create: `website/content/search.ts`
- Create: `website/components/Search.tsx`
- Create: `website/generated/search-index.json`
- Create: `scripts/build-search-index.mjs`
- Create: `scripts/check-doc-links.mjs`
- Create: `scripts/check-doc-links.test.mjs`
- Create: `e2e/website/search.spec.ts`
- Create: `e2e/website/accessibility.spec.ts`
- Create: `e2e/website/visual.spec.ts`
- Modify: `playwright.website.config.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Produces**

- Build-time local search index
- Link, accessibility, screenshot, and performance gates

**Steps**

- [ ] Test deterministic indexing of page titles, headings, recipes, components, and props.
- [ ] Build a keyboard-accessible search dialog with ordinary links as results.
- [ ] Add a crawler that rejects broken internal routes, fragments, and duplicate heading identifiers.
- [ ] Add automated accessibility checks for the homepage, docs shell, recipe pages, and an open sheet.
- [ ] Add stable screenshots for desktop and 320-pixel homepage, docs, and recipe states.
- [ ] Add Lighthouse budgets for performance, accessibility, and cumulative layout shift.
- [ ] Run the new gates in CI after the static website build.
- [ ] Verify the complete `npm run check` and all three Playwright browser projects.
- [ ] Commit the final quality gates.

## Completion criteria

- The homepage communicates value through a real sheet and verified evidence.
- All planned Learn, Recipes, Reference, Migration, and Project routes exist.
- Every recipe shares its implementation with its defining browser test.
- All public exports and styling contracts are documented.
- Search works with keyboard and pointer input without an external service.
- Static export, Vercel previews, package checks, three-browser tests, accessibility checks, visual checks, and performance budgets pass.
- No package public API changes are introduced by the documentation work.
