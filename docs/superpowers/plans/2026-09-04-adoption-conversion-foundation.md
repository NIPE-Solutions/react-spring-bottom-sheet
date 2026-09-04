# Adoption Conversion Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give prospective adopters a clear repository introduction, a search-friendly migration destination, accurate GitHub metadata, and a private campaign record before outreach begins.

**Architecture:** Keep marketing claims backed by existing release evidence and reuse the website's static Next.js content patterns. Add one dedicated static migration route as the canonical outreach destination, strengthen the README without duplicating the full documentation, mutate GitHub metadata only after code is published, and store contact tracking outside version control.

**Tech Stack:** Markdown, Next.js 16 App Router/static export, React 19, TypeScript, Node test runner, Playwright, GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-09-04-adoption-campaign-design.md`

## Global Constraints

- Describe the project as an “independently maintained continuation,” never as the official successor without explicit original-maintainer authorization.
- Lead with React 19 compatibility, accessibility, composability, and browser verification; maintenance is supporting evidence.
- Preserve prominent attribution to Cody Olsen and Jasmine GH.
- Back every compatibility, package, and browser claim with checked repository evidence.
- Keep the site statically exportable and include the migration route in metadata, navigation, sitemap, accessibility, and narrow-layout verification.
- Write public outreach in the first person as Nicholas.
- Keep personal contact information and correspondence outside version control.
- Do not request ownership transfer, npm access, deprecation, or an official endorsement without separate approval.

---

### Task 1: README conversion surface

**Files:**

- Modify: `README.md`
- Modify: `scripts/verify-website.test.mjs`

**Interfaces:**

- Consumes: the production documentation URL and existing project-lineage section.
- Produces: a concise repository introduction with `Live demo`, `Migration from the original`, and `Why version 5` destinations.

- [ ] **Step 1: Add failing README contract assertions**

Extend the existing README verification test in `scripts/verify-website.test.mjs` to require the package name, production docs URL, the dedicated migration URL `/migration-from-react-spring-bottom-sheet/`, the exact phrase `independently maintained continuation`, React 19, accessibility, Chromium, Firefox, WebKit, Cody Olsen, and Jasmine GH. Reject the phrase `official successor`.

```js
assert.match(readme, /independently maintained continuation/i)
assert.match(readme, /migration-from-react-spring-bottom-sheet/)
assert.doesNotMatch(readme, /official successor/i)
```

- [ ] **Step 2: Run the README contract and verify RED**

Run: `node --test scripts/verify-website.test.mjs`

Expected: FAIL because the README does not yet link to the dedicated migration route or contain the approved positioning.

- [ ] **Step 3: Rewrite the README opening and adoption sections**

Keep the existing install and example code, but place this positioning directly below the title:

```markdown
Accessible, composable bottom sheets for React 19. An independently maintained
continuation of the original `react-spring-bottom-sheet`, rebuilt with compound
components, explicit styling contracts, and current-browser verification.
```

Add a compact navigation row linking to the live docs, examples, migration page, API reference, and npm. Add a `Why version 5` section covering React 19, accessible dialog/focus behavior, interruption-safe gestures and motion, replaceable styling, and the tested browser matrix. Add a short `Migrating from the original package` section that names both packages and links to the dedicated migration page and detailed repository guide. Retain the full lineage section and avoid decorative badge overload; include only npm version, CI, license, and React 19 badges whose targets are stable.

- [ ] **Step 4: Verify the README contract and formatting**

Run: `node --test scripts/verify-website.test.mjs && npx prettier --check README.md scripts/verify-website.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the README conversion surface**

```bash
git add README.md scripts/verify-website.test.mjs
git commit -m "docs: sharpen maintained continuation positioning"
```

### Task 2: Migration discovery route

**Files:**

- Create: `website/app/(site)/migration-from-react-spring-bottom-sheet/page.tsx`
- Create: `website/content/migration.tsx`
- Create: `website/content/migration.test.tsx`
- Modify: `website/components/SiteHeader.tsx`
- Modify: `website/components/SiteFooter.tsx`
- Modify: `website/app/sitemap.ts`
- Modify: `website/app/site.css`
- Modify: `scripts/verify-website.test.mjs`
- Modify: `scripts/check-website-css.test.mjs`
- Modify: `e2e/website/docs.spec.ts`

**Interfaces:**

- Produces: static route `/migration-from-react-spring-bottom-sheet/` with canonical metadata and the reusable `MigrationPageContent` component.
- Consumes: `CodeBlock`, existing documentation URLs, `@nipe-solutions/react-spring-bottom-sheet`, and the v4-to-v5 mapping in `docs/migration-v4-to-v5.md`.

- [ ] **Step 1: Write failing content and static-route contracts**

Create `website/content/migration.test.tsx` to render `MigrationPageContent` and require:

```tsx
expect(screen.getByRole('heading', {
  level: 1,
  name: /migrate from react-spring-bottom-sheet/i,
})).toBeVisible()
expect(screen.getByText(/independently maintained continuation/i)).toBeVisible()
expect(screen.getByText('react-spring-bottom-sheet')).toBeVisible()
expect(screen.getByText('@nipe-solutions/react-spring-bottom-sheet')).toBeVisible()
expect(screen.getByRole('link', { name: /complete migration guide/i }))
  .toHaveAttribute('href', '/docs/migration/')
```

Extend `scripts/verify-website.test.mjs` to require the new route, canonical URL, title containing `React 19`, and sitemap entry. Extend `e2e/website/docs.spec.ts` to require a visible header or footer link and successful navigation to the route.

- [ ] **Step 2: Run the route contracts and verify RED**

Run: `npx vitest run website/content/migration.test.tsx && node --test scripts/verify-website.test.mjs`

Expected: FAIL because the component and route do not exist.

- [ ] **Step 3: Implement factual migration content**

Create a server-rendered page with these sections:

1. Hero: independent continuation, React 19, and a direct installation command.
2. `Choose your path`: evaluate v5 directly versus remain on the original package until migration is possible.
3. Before/after controlled example using the existing server `CodeBlock`.
4. API mapping table covering `open`, `blocking`, `onDismiss`, `snapPoints`, `defaultSnap`, `header`, `footer`, `BottomSheetRef`, `expandOnContentDrag`, and stylesheet imports.
5. Requirements: React 19 and current Chromium, Firefox, and WebKit.
6. Calls to action: examples, full migration guide, API reference, npm, and GitHub.
7. Lineage note naming Cody Olsen, Jasmine GH, and independent NIPE Solutions maintenance.

The page metadata must use:

```ts
export const metadata: Metadata = {
  title: 'Migrate react-spring-bottom-sheet to React 19',
  description:
    'Move from the original react-spring-bottom-sheet to an independently maintained React 19 implementation with an explicit API and styling migration path.',
  alternates: {
    canonical: '/migration-from-react-spring-bottom-sheet/',
  },
}
```

- [ ] **Step 4: Add restrained navigation and sitemap discovery**

Add one `Migration` link to the site footer and, if the header remains contained at 320px, to the primary header. Add the route to `website/app/sitemap.ts` with the same static base URL pattern as other entries. Do not displace Docs or Examples.

- [ ] **Step 5: Add route-owned responsive styles and CSS contracts**

Use only `docs-*` classes. Add a centered article measure, a responsive two-column before/after region that collapses at the existing compact breakpoint, an overflow-contained mapping table, and ordinary document typography. Extend `scripts/check-website-css.test.mjs` to assert `max-width`, `min-width: 0`, internal table overflow, and the compact single-column rule.

- [ ] **Step 6: Run focused unit and static checks**

Run: `npx vitest run website/content/migration.test.tsx && npm run test:website && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Run browser checks for discovery, accessibility, and containment**

Extend `e2e/website/docs.spec.ts` with an accessibility scan and a 320px overflow assertion for the migration route.

Run: `npm run test:website:e2e -- --project=chromium e2e/website/docs.spec.ts --grep "migration"`

Expected: PASS with navigation, no detectable accessibility violations, and no document-level horizontal overflow.

- [ ] **Step 8: Commit the migration discovery route**

```bash
git add website scripts/verify-website.test.mjs scripts/check-website-css.test.mjs e2e/website/docs.spec.ts
git commit -m "feat(docs): add original-package migration page"
```

### Task 3: GitHub repository metadata

**Files:**

- No tracked files.

**Interfaces:**

- Consumes: published production documentation URL and the approved repository-description text.
- Produces: GitHub description, homepage, and ten focused repository topics.

- [ ] **Step 1: Capture current metadata**

Run:

```bash
gh repo view NIPE-Solutions/react-spring-bottom-sheet \
  --json description,homepageUrl,repositoryTopics,url
```

Save the returned values in the private campaign tracker before mutation.

- [ ] **Step 2: Update description and homepage**

Run:

```bash
gh repo edit NIPE-Solutions/react-spring-bottom-sheet \
  --description "Accessible, composable React 19 bottom sheets — an independently maintained continuation of react-spring-bottom-sheet." \
  --homepage "https://react-spring-bottom-sheet.nipesolutions.com"
```

- [ ] **Step 3: Replace topics with the approved focused set**

Read the current topics first and preserve any existing topic that is both accurate and not redundant. Ensure the final set contains:

```text
react
react-19
bottom-sheet
drawer
dialog
accessibility
typescript
gesture
headless-ui
react-spring-bottom-sheet
```

Use `gh repo edit --add-topic <topic>` for missing topics and `--remove-topic <topic>` only for clearly inaccurate topics.

- [ ] **Step 4: Read back and verify metadata**

Run:

```bash
gh repo view NIPE-Solutions/react-spring-bottom-sheet \
  --json description,homepageUrl,repositoryTopics,url
```

Expected: exact approved description and homepage, with every approved topic present.

### Task 4: Private campaign tracker

**Files:**

- Modify locally only: `.git/info/exclude`
- Create locally only: `.campaign/adoption-tracker.md`

**Interfaces:**

- Produces: a persistent local record excluded from Git status.
- Stores: target, dependency relationship, channel, public URL, date, status, last action, next follow-up, response, blocker, and resulting evidence.

- [ ] **Step 1: Exclude the local campaign directory**

Resolve the shared Git directory with `git rev-parse --git-common-dir`, append `/.campaign/` to its `info/exclude` only if absent, and verify `git check-ignore -v .campaign/probe` identifies the local exclude rule.

- [ ] **Step 2: Create the tracker with no private addresses**

Create `.campaign/adoption-tracker.md` with sections for repository metadata baseline, original-maintainer outreach, upstream dependency outreach, migration candidates, publications, and metrics. Use this table:

```markdown
| Target | Relationship | Channel | Public URL | Status | Last action | Follow-up | Response/blocker | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
```

Seed only already verified public facts: npm download windows, PR URLs, and repository URLs. Do not store access tokens or unpublished personal contact information.

- [ ] **Step 3: Verify tracker privacy and persistence**

Run: `git status --short --untracked-files=all && git check-ignore -v .campaign/adoption-tracker.md`

Expected: the tracker does not appear in Git status and `git check-ignore` points to the shared local exclude file.

### Task 5: Foundation integration gate

**Files:**

- Verify all files changed in Tasks 1–2; no new implementation files.

**Interfaces:**

- Consumes: README, migration route, GitHub metadata, and tracker outputs.
- Produces: a reviewable feature branch and the canonical URL needed by the outreach plan.

- [ ] **Step 1: Rebase onto the merged example-workbench branch**

After PR #49 merges, fetch `origin/main`, rebase `feat/adoption-campaign` onto it, and resolve overlaps by retaining the workbench's shared `CodeBlock` system. Do not duplicate source-highlighting primitives.

- [ ] **Step 2: Run the complete repository gate**

Run: `npm run check`

Expected: PASS with formatting, lint, unit tests, type checks, package checks, and the static website build.

- [ ] **Step 3: Run the complete website browser matrix**

Run: `npm run test:website:e2e`

Expected locally: Chromium and Firefox pass. If local WebKit rejects `PushAPIEnabled`, record that exact environment limitation and require the PR's Linux WebKit job to pass before merge.

- [ ] **Step 4: Verify public metadata and clean state**

Run:

```bash
gh repo view NIPE-Solutions/react-spring-bottom-sheet \
  --json description,homepageUrl,repositoryTopics,url
git status --short --branch
```

Expected: approved GitHub metadata and no tracked or untracked campaign notes.

- [ ] **Step 5: Push and open the foundation PR**

Push `feat/adoption-campaign` and open a PR titled `docs: establish the adoption conversion foundation`. Describe the independent-continuation positioning, migration route, GitHub metadata, private tracker exclusion, and fresh verification evidence. Keep the worktree for review changes.

## Deferred phase-specific plans

After this foundation is published, create separate plans for:

1. Original-maintainer and dependency-maintainer outreach, using the canonical migration URL.
2. Candidate research and up to three target-repository migrations, after maintainers identify the correct ownership paths.
3. Technical article and community launch, after the evidence threshold in the specification is met.

These plans must use real recipients, repository APIs, and test commands discovered during the preceding phase; they must not invent targets or publication channels in advance.
