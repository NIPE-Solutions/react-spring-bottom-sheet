# Example Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn recipe pages into focused device laboratories with an on-demand source inspector and give all substantial website snippets one accurate, server-rendered highlighting system.

**Architecture:** Generalize the existing server-only Shiki boundary into a typed, language-aware `CodeBlock`, then compose it inside a client-owned accessible source inspector. Keep device selection in the existing URL state machine, using Next.js non-scrolling navigation so the iframe and document position remain stable.

**Tech Stack:** Next.js 16 App Router/static export, React 19, TypeScript, Shiki core with the JavaScript regex engine, Vitest/Testing Library, Playwright, plain namespaced CSS.

**Spec:** `docs/superpowers/specs/2026-09-04-example-workbench-design.md`

## Global Constraints

- Preserve the public npm package API and the static-export architecture.
- Keep syntax highlighting server/build-only; no Shiki or grammar engine may enter client JavaScript.
- Render highlighted tokens as React nodes and never inject highlighted HTML.
- Preserve canonical source bytes, whitespace, blank lines, and terminal newlines.
- Keep recipe iframe identity, open-sheet state, URL history, and morph interruption/rollback behavior across device changes.
- Use only `docs-*` website classes and retain the isolated `rsbs-example-*` recipe namespace.
- Support exactly `tsx`, `css`, and `shell` in the first shared code-block release.
- Respect reduced motion, keyboard operation, focus restoration, safe-area insets, and 320 CSS-pixel containment.
- Require Chromium, Firefox, and CI WebKit before merge; local WebKit remains unavailable because the pinned binary rejects `PushAPIEnabled`.

---

### Task 1: Language-aware server code blocks

**Files:**

- Modify: `website/components/source-code/highlighter.ts`
- Modify: `website/components/source-code/highlighter.test.ts`
- Modify: `website/components/source-code/highlighter-singleton.test.ts`
- Rename: `website/components/source-code/HighlightedCode.tsx` to `website/components/source-code/CodeTokens.tsx`
- Create: `website/components/source-code/CodeBlock.tsx`
- Create: `website/components/source-code/CodeBlock.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Produces: `type CodeLanguage = 'tsx' | 'css' | 'shell'`.
- Produces: `highlightCode(source: string, language: CodeLanguage): Promise<HighlightedLine[]>`.
- Produces: `CodeBlock(props: { source: string; language: CodeLanguage; filename?: string; label?: string; lineNumbers?: boolean; copy?: boolean; className?: string }): Promise<ReactElement>`.
- Produces: `CodeTokens({ source, lines, label, lineNumbers })`, preserving exact native selection bytes.

- [ ] **Step 1: Write failing highlighter tests for all supported languages**

Add table-driven tests which call `highlightCode` with TSX, CSS, and shell samples, restore token content, and require exact equality including a terminal newline. Require at least four distinct non-default semantic colors per language and explicit distinctions for TSX tags/attributes, CSS properties/values, and shell commands/flags.

```ts
const samples = {
  tsx: 'const view = <Sheet.Content aria-label="Cart" />\n',
  css: '.cart-sheet { color: var(--brand); }\n',
  shell: 'npm install @nipe-solutions/react-spring-bottom-sheet\n',
} as const

for (const [language, source] of Object.entries(samples)) {
  const lines = await highlightCode(source, language as CodeLanguage)
  expect(restoreSource(lines)).toBe(source)
  expect(
    new Set(lines.flat().map((token) => token.color)).size,
  ).toBeGreaterThan(3)
}
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run website/components/source-code/highlighter.test.ts website/components/source-code/highlighter-singleton.test.ts`

Expected: FAIL because `CodeLanguage` and `highlightCode` do not exist and the singleton currently loads only TSX.

- [ ] **Step 3: Generalize the singleton highlighter and custom theme**

Add fine-grained CSS and shell language imports, retain `shiki/core` plus `createJavaScriptRegexEngine`, and load all three grammars in the single module-level promise. Expand the custom theme with JSX tag/attribute/property scopes plus CSS and shell scopes. Keep all colors as explicit site-owned hex values and expose no production test hook.

```ts
export type CodeLanguage = 'tsx' | 'css' | 'shell'

const highlighterPromise = createHighlighter({
  engine: createJavaScriptRegexEngine(),
  langs: [langTsx, langCss, langShell],
  themes: [codeTheme],
})

export async function highlightCode(source: string, language: CodeLanguage) {
  const highlighter = await highlighterPromise
  return normalizeTokens(
    highlighter.codeToTokens(source, { lang: language, theme: codeTheme.name })
      .tokens,
  )
}
```

- [ ] **Step 4: Write failing `CodeBlock` render tests**

Test minimal shell chrome, TSX with filename/line numbers/copy, an accessible scroll-region label, exact visible source text, and the absence of line numbers from the selectable code value.

```tsx
const block = await CodeBlock({
  source: 'const open = true\n',
  language: 'tsx',
  filename: 'Example.tsx',
  lineNumbers: true,
  copy: true,
})
render(block)
expect(
  screen.getByRole('region', { name: 'Example.tsx source code' }),
).toBeVisible()
expect(screen.getByRole('button', { name: 'Copy source' })).toBeVisible()
```

- [ ] **Step 5: Run the component test and verify RED**

Run: `npx vitest run website/components/source-code/CodeBlock.test.tsx`

Expected: FAIL because `CodeBlock` and the generalized token renderer do not exist.

- [ ] **Step 6: Implement `CodeTokens` and `CodeBlock` minimally**

Move the reviewed literal-line-separator algorithm from `HighlightedCode` into `CodeTokens`. Make line numbers optional and keep the zero-size terminal-LF boundary. `CodeBlock` highlights on the server, renders optional metadata chrome, and composes the existing `CopySourceButton` only when `copy` is true.

```tsx
export async function CodeBlock(props: CodeBlockProps) {
  const lines = await highlightCode(props.source, props.language)
  const label =
    props.label ??
    (props.filename
      ? `${props.filename} source code`
      : `${props.language} code`)

  return (
    <section className={joinCodeBlockClasses(props.className)}>
      {props.filename || props.copy ? <CodeBlockHeader {...props} /> : null}
      <CodeTokens
        source={props.source}
        lines={lines}
        label={label}
        lineNumbers={props.lineNumbers ?? false}
      />
    </section>
  )
}
```

- [ ] **Step 7: Run focused tests and typecheck**

Run: `npx vitest run website/components/source-code && npm run typecheck`

Expected: all focused tests pass; the constructor-count test still observes one construction across languages.

- [ ] **Step 8: Commit Task 1**

```bash
git add package.json package-lock.json website/components/source-code
git commit -m "feat(docs): add shared highlighted code blocks"
```

### Task 2: Migrate homepage and documentation snippets

**Files:**

- Modify: `website/components/QuickStart.tsx`
- Modify: `website/components/LaunchPath.tsx`
- Modify: `website/app/(site)/docs/[slug]/page.tsx`
- Modify: `website/content/types.ts`
- Modify: `website/content/docs.ts`
- Modify: `website/content/learn/anatomy.tsx`
- Modify: `website/content/learn/installation.tsx`
- Modify: `website/content/learn/snap-points.tsx`
- Modify: `website/content/learn/styling.tsx`
- Create: `website/components/source-code/code-coverage.test.ts`
- Modify: `scripts/verify-website.test.mjs`

**Interfaces:**

- Consumes: `CodeBlock` and `CodeLanguage` from Task 1.
- Changes: `DocSection.code` from `string | undefined` to `{ source: string; language: CodeLanguage; lineNumbers?: boolean } | undefined`.
- Produces: an explicit `/examples/` CTA in the generic Examples documentation page.

- [ ] **Step 1: Write failing migration and CTA tests**

Create a source-contract test that scans website TSX files outside `CodeTokens.tsx` and rejects block-level raw `<pre>` elements. Extend the website verifier to require the Examples page definition to expose `/examples/` through a typed `href` field.

```ts
for (const file of blockSnippetFiles) {
  expect(readFileSync(file, 'utf8')).not.toMatch(/<pre(?:\s|>)/)
}
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run website/components/source-code/code-coverage.test.ts && node --test scripts/verify-website.test.mjs`

Expected: FAIL on current raw homepage/docs `<pre>` blocks and missing Examples CTA metadata.

- [ ] **Step 3: Add typed code and link metadata**

Extend `DocSection` with the exact code object above and optional `link: { href: string; label: string }`. Give the Examples section this link:

```ts
link: { href: '/examples/', label: 'Open the example laboratory' }
```

Render generic page code with `CodeBlock` and section links with `next/link`.

- [ ] **Step 4: Migrate explicit homepage and learn-guide snippets**

Replace every block-level `<pre><code>` with awaited server `CodeBlock` composition. Keep inline `<code>` unchanged. Use `shell` for commands, `tsx` for component/import examples, and `css` for stylesheet examples. Preserve every existing source string byte-for-byte.

- [ ] **Step 5: Run focused website checks**

Run: `npx vitest run website/components/source-code/code-coverage.test.ts website/content/navigation.test.ts website/content/learn/installation.test.tsx && npm run test:website && npm run typecheck`

Expected: all tests pass and no raw substantial code block remains.

- [ ] **Step 6: Commit Task 2**

```bash
git add website scripts/verify-website.test.mjs
git commit -m "feat(docs): highlight website code examples"
```

### Task 3: Accessible source inspector

**Files:**

- Create: `website/components/source-code/SourceInspector.tsx`
- Create: `website/components/source-code/SourceInspector.test.tsx`
- Modify: `website/components/RecipeSource.tsx`
- Modify: `website/components/RecipePreview.tsx`
- Modify: `website/app/(site)/examples/[slug]/page.tsx`
- Modify: `website/app/site.css`

**Interfaces:**

- Consumes: `CodeBlock` from Task 1 with canonical recipe source.
- Produces: `SourceInspector({ filename, children, triggerLabel?: string })` with a trigger and modal inspector.
- Preserves: one server-highlighted source tree; opening the inspector never reloads the iframe.

- [ ] **Step 1: Write failing inspector behavior tests**

Cover closed-by-default state, accessible dialog name, initial close-button focus, Tab/Shift+Tab containment, Escape/backdrop/close-button dismissal, trigger-focus restoration, body scroll lock cleanup, reduced-motion class/state, and copy failure not blocking dismissal.

```tsx
render(
  <SourceInspector filename="BasicSheet.tsx">
    <pre>const open = true</pre>
  </SourceInspector>,
)
const trigger = screen.getByRole('button', { name: 'View source' })
await user.click(trigger)
expect(
  screen.getByRole('dialog', { name: 'BasicSheet.tsx source' }),
).toBeVisible()
expect(screen.getByRole('button', { name: 'Close source' })).toHaveFocus()
await user.keyboard('{Escape}')
expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
expect(trigger).toHaveFocus()
```

- [ ] **Step 2: Run the inspector test and verify RED**

Run: `npx vitest run website/components/source-code/SourceInspector.test.tsx`

Expected: FAIL because the inspector does not exist and source is a static details block.

- [ ] **Step 3: Implement the inspector client shell**

Use a portal-backed modal dialog with a labelled title and explicit backdrop. Store the trigger and dialog refs, focus the close button after opening, contain focus with a keydown handler, close on Escape/backdrop, lock body overflow while open, and restore the connected trigger with `{ preventScroll: true }`. Keep motion as CSS state driven by `data-state` and disable it under `prefers-reduced-motion`.

- [ ] **Step 4: Compose server-highlighted source without client highlighting**

Keep `RecipeSource` async/server-owned. Render `CodeBlock` once and pass the resulting React node as the inspector child. Move the source trigger into the Preview heading row through a `sourceAction` slot rather than coupling device controls to source state.

```tsx
const code = await CodeBlock({
  source,
  language: 'tsx',
  filename,
  lineNumbers: true,
  copy: true,
})
return <SourceInspector filename={filename}>{code}</SourceInspector>
```

- [ ] **Step 5: Simplify recipe document order**

Remove the permanent source grid column. Render header, preview/source trigger, one guidance region containing prerequisites/behavior/accessibility, and related docs. Preserve semantic headings and searchable note text.

- [ ] **Step 6: Add responsive inspector styles**

Use a fixed overlay layer with a quiet backdrop. On wide screens cap the inline-end drawer at `min(48rem, 72vw)` and show part of the laboratory beneath; below 809px fill the viewport and apply safe-area padding. Code scrolls internally without wrapping or page overflow. Add one transform transition owned by open/close state and a reduced-motion override.

- [ ] **Step 7: Run focused behavior, CSS, and accessibility tests**

Run: `npx vitest run website/components/source-code/SourceInspector.test.tsx website/components/source-code/CopySourceButton.test.tsx && npm run test:website && npm run test:css && npm run typecheck`

Expected: all tests pass with no accessibility-role or namespace violations.

- [ ] **Step 8: Commit Task 3**

```bash
git add website/components website/app/'(site)'/examples website/app/site.css
git commit -m "feat(docs): add recipe source inspector"
```

### Task 4: Preserve scroll during device navigation

**Files:**

- Modify: `website/components/device-lab/DeviceLab.tsx`
- Modify: `website/components/device-lab/use-scaled-frame.test.tsx`
- Modify: `e2e/website/recipes.spec.ts`

**Interfaces:**

- Preserves: existing `router.push(url)` history semantics for user changes.
- Changes: user `router.push(url, { scroll: false })` and normalization `router.replace(url, { scroll: false })`.

- [ ] **Step 1: Write failing unit assertions for router options**

Update mocked-router expectations for both a user change and invalid-query normalization:

```ts
expect(navigation.push).toHaveBeenCalledWith(
  '/examples/basic/?device=tablet&orientation=portrait',
  { scroll: false },
)
expect(navigation.replace).toHaveBeenCalledWith(normalizedUrl, {
  scroll: false,
})
```

- [ ] **Step 2: Write the failing browser scroll regression**

Navigate to a recipe, scroll the document until the controls are near the top, record `scrollY`, change both orientation and device, wait for each morph to settle, and require the final `scrollY` to equal the recorded position within one CSS pixel. Also assert the same iframe handle and open sheet remain.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npx vitest run website/components/device-lab/use-scaled-frame.test.tsx`

Expected: FAIL because calls currently omit `{ scroll: false }`.

- [ ] **Step 4: Apply the root-cause fix**

Pass `{ scroll: false }` to both App Router calls. Do not add manual scroll capture/restoration and do not alter morph state.

- [ ] **Step 5: Run focused unit and Chromium browser tests**

Run: `npx vitest run website/components/device-lab/use-scaled-frame.test.tsx`

Run the scroll-tagged Playwright test through the ignored
`.superpowers/sdd/2026-09-04-example-workbench/local-playwright.config.ts`
configuration on verified-free port 4287 and Chromium.

Expected: unit and browser tests pass; scroll, iframe identity, sheet state, and history assertions remain green.

- [ ] **Step 6: Commit Task 4**

```bash
git add website/components/device-lab e2e/website/recipes.spec.ts
git commit -m "fix(docs): preserve example scroll position"
```

### Task 5: Visual refinement and cross-browser proof

**Files:**

- Modify: `website/app/site.css`
- Modify: `e2e/website/home.spec.ts`
- Modify: `e2e/website/docs.spec.ts`
- Modify: `e2e/website/recipes.spec.ts`
- Modify: `scripts/check-website-css.test.mjs`
- Modify: `scripts/verify-website.test.mjs`

**Interfaces:**

- Consumes: shared CodeBlock, SourceInspector, and non-scrolling device navigation.
- Produces: final responsive/accessible behavior and static-output evidence.

- [ ] **Step 1: Add failing browser and CSS contracts**

Require highlighted tokens on homepage TSX and install command blocks, one TSX/CSS/shell documentation sample, and recipe source. At 1440px require an inline-end drawer overlay without preview geometry change; at 320px require a viewport inspector, contained code, reachable actions, and no document overflow. Require no code wrapping and visible keyboard focus.

- [ ] **Step 2: Run focused Chromium tests and verify RED**

Run the new home/docs/recipe tests with
`.superpowers/sdd/2026-09-04-example-workbench/local-playwright.config.ts` on
verified-free port 4287.

Expected: FAIL until selectors, breakpoint behavior, and final palette/chrome are complete.

- [ ] **Step 3: Refine the custom code and workbench styles**

Apply the approved palette and technical manuscript treatment consistently. Remove obsolete two-column recipe/source and details styles. Keep the device lab centered, align its heading action, consolidate note spacing, and ensure drawer transitions affect only transform/backdrop opacity.

- [ ] **Step 4: Run complete local verification**

Run: `npm run check`

Run: `npm run test:website:e2e -- --config .superpowers/sdd/2026-09-04-example-workbench/local-playwright.config.ts --project=chromium --project=firefox`

Expected: repository checks pass; every Chromium/Firefox website test passes.

- [ ] **Step 5: Inspect production artifacts**

Serve `website/out` on verified-free port 4287. Confirm all 53 static pages exist,
highlighted token markup appears for all three languages, ordinary and embed
recipe routes remain distinct, and these commands return no client-runtime
matches:

```bash
rg -ni 'shiki|onig\.wasm|@shikijs' website/out/_next/static || true
git diff --check
```

- [ ] **Step 6: Commit Task 5**

```bash
git add website e2e scripts
git commit -m "style(docs): refine the example workbench"
```

### Task 6: Final review and pull-request gate

**Files:**

- Review: all files changed from `10474fbb9221549b55fae21bfc6fd884c1d26f40` to `HEAD`
- Update only if required by review: files already in Tasks 1–5

**Interfaces:**

- Produces: a reviewed, clean branch ready for a pull request against `main` after PR #48 merges.

- [ ] **Step 1: Audit spec coverage**

Map each outcome, accessibility rule, responsive rule, failure case, and verification requirement from the spec to implementation and tests. Record any gap before requesting review.

- [ ] **Step 2: Run the final repository and browser gates from the final tree**

Run `npm run check`, then the full Chromium/Firefox website suite through
`.superpowers/sdd/2026-09-04-example-workbench/local-playwright.config.ts`.
Require zero failures and confirm the worktree contains only committed intended
changes.

- [ ] **Step 3: Request code review**

Review the complete diff for correctness, public API stability, server/client boundaries, exact source copying, navigation history/scroll behavior, focus lifecycle, responsive containment, reduced motion, and misleading claims. Address Critical and Important findings with focused regression tests.

- [ ] **Step 4: Re-run affected checks and the final gate**

After any review fix, run the focused regression first, then `npm run check`, Chromium/Firefox website tests, `git diff --check`, and production client-bundle inspection again.

- [ ] **Step 5: Prepare the pull request**

After PR #48 is merged, rebase or merge the latest `origin/main` without force-pushing, resolve only genuine follow-up conflicts, and rerun the final gate. Push only after user approval, open a PR against `main`, and require Quality, Chromium, Chromium Touch, Firefox, WebKit, and Vercel checks before merge.
