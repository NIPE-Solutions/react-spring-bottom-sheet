# Version 5 Stable Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the reviewed version 5 codebase to `main`, publish `5.0.0` on npm's `latest` channel, and expose accurate release status on the production website.

**Architecture:** Work moves through protected stages: stable preparation on `v5`, code-line promotion to `main`, production sign-off, trusted publication, and a post-publication website update. Release presentation uses the package version plus an explicit set of publicly verified versions, preventing previews from claiming an unpublished package exists.

**Tech Stack:** Git worktrees, GitHub pull requests and Actions, npm trusted publishing with OIDC, React 19, TypeScript, Vitest, Playwright, Next.js, Vercel.

**Spec:** `docs/roadmap/v5-stable-promotion-design.md`

## Global Constraints

- Never push directly to `v5` or `main`; repository changes land through reviewed pull requests.
- Publish `5.0.0` only from the exact signed-off `main` commit through `.github/workflows/release.yml` with channel `latest`.
- Never overwrite an npm version or Git tag; keep `next` on `5.0.0-alpha.0` unless separately authorized.
- Do not claim `5.0.0` is available before the public npm registry confirms it.
- Keep repository and release text free of automation or assistant attribution.
- Require Node.js 24, React 19, all release gates, every configured browser project, and the protected `npm` environment.

---

### Task 1: Synchronize protected-branch ancestry

**Files:**

- Resolve if conflicted: `package-lock.json`
- Verify: version 5 source, package metadata, and workflows

**Interfaces:**

- Consumes: current `origin/v5` and `origin/main`.
- Produces: a preparation branch containing both histories and the version 5 dependency graph.

- [ ] **Step 1: Refresh and inspect branch tips**

```bash
git fetch origin --prune
git log -1 --oneline origin/v5
git log -1 --oneline origin/main
git status --short --branch
```

Expected: clean `release/v5-stable-preparation`, based on `origin/v5`.

- [ ] **Step 2: Stage the ancestry merge**

```bash
git merge --no-ff --no-commit origin/main
```

Expected: a clean staged merge or conflicts only in independently changed files. Inspect before committing.

- [ ] **Step 3: Retain and regenerate the v5 lockfile if conflicted**

```bash
git checkout --ours package-lock.json
npm install --package-lock-only --ignore-scripts
git add package-lock.json
git diff --name-only --diff-filter=U
git diff --cached --stat
```

Expected: no unresolved paths, no restored v4 sources, and v5 dependencies remain authoritative.

- [ ] **Step 4: Verify and commit the synchronized tree**

```bash
npm ci
npm test
npm run typecheck
git commit -m "chore: synchronize stable release history"
```

Expected: 122 unit tests and TypeScript pass before the merge commit.

---

### Task 2: Represent prepared stable releases truthfully

**Files:**

- Modify: `website/content/release.test.ts`
- Modify: `website/content/release.ts`
- Modify: `website/components/QuickStart.tsx`
- Modify: `website/components/LaunchPath.tsx`
- Modify: `website/content/learn/installation.tsx`
- Modify: `e2e/website/docs.spec.ts`

**Interfaces:**

- Consumes: `getReleasePresentation(version: string)` and `buildEvidence.version`.
- Produces: exact-version `published` state independent of prerelease status.

- [ ] **Step 1: Write failing state tests**

```ts
test('prepared stable releases use latest without claiming publication', () => {
  expect(getReleasePresentation('5.0.0')).toEqual({
    channel: 'latest',
    installCommand: 'npm install @nipe-solutions/react-spring-bottom-sheet',
    prerelease: false,
    published: false,
  })
})

test('published stable releases remain available', () => {
  expect(getReleasePresentation('4.1.0').published).toBe(true)
})
```

- [ ] **Step 2: Verify the test fails for the existing stable default**

```bash
npm run test:unit -- website/content/release.test.ts
```

Expected: FAIL because every stable version currently reports `published: true`.

- [ ] **Step 3: Implement explicit public-version state**

Use:

```ts
const publishedVersions = new Set(['4.1.0', '5.0.0-alpha.0'])
```

and return `published: publishedVersions.has(version)`.

- [ ] **Step 4: Update component branches**

Use `!release.published` for qualifiers in `QuickStart` and `LaunchPath`. In `InstallationGuide`, render unpublished copy as:

```tsx
<>
  <strong>Prepared release</strong>: version {buildEvidence.version} is not
  published yet. After publication, it will be available from npm&apos;s{' '}
  <code>{release.channel}</code> tag.
</>
```

Keep published prerelease copy separate, and label every unpublished install command `After publication`.

- [ ] **Step 5: Extend rendered-state expectations**

In `e2e/website/docs.spec.ts`, derive `release` with `getReleasePresentation(packageVersion)` and assert:

```ts
await expect(page.getByText('Prepared release', { exact: true })).toHaveCount(
  release.published ? 0 : 1,
)
await expect(
  page.getByText('is not published yet', { exact: false }),
).toHaveCount(release.published ? 0 : 1)
```

- [ ] **Step 6: Verify and commit**

```bash
npm run test:unit -- website/content/release.test.ts
npm run test:website
npm run typecheck
npm run lint
git add website e2e/website/docs.spec.ts
git commit -m "fix: distinguish prepared stable releases"
```

---

### Task 3: Prepare immutable `5.0.0` metadata and evidence

**Files:**

- Modify: `package.json`, `package-lock.json`, `CHANGELOG.md`
- Regenerate: `website/content/evidence.ts`
- Create: `docs/releases/v5.0.0-signoff.md`

**Interfaces:**

- Consumes: Task 2 release state and `docs/releases/v5-alpha.0-signoff.md`.
- Produces: an unpublished `5.0.0` candidate with explicit remaining gates.

- [ ] **Step 1: Change metadata without tagging**

```bash
npm version 5.0.0 --no-git-tag-version
node scripts/write-website-evidence.mjs
```

- [ ] **Step 2: Finalize the changelog**

Use this first heading:

```markdown
## [5.0.0](https://github.com/NIPE-Solutions/react-spring-bottom-sheet/compare/4.1.0...v5.0.0) (2026-09-03)
```

Replace alpha-oriented introductory text with stable React 19 redesign and migration guidance. Preserve Added, Changed, and Removed details.

- [ ] **Step 3: Create the stable sign-off record**

Create `docs/releases/v5.0.0-signoff.md` recording the alpha VoiceOver, keyboard, physical iOS, and physical Android evidence as carried forward because post-alpha changes do not alter runtime behavior. Add unchecked entries for complete stable automation, GitHub browser checks, exact packed consumers, production deployment, and external publishing protection. State that publication remains blocked until every item is complete.

- [ ] **Step 4: Verify metadata and prepared rendering**

```bash
node -e "const p=require('./package.json'); const l=require('./package-lock.json'); if (p.version !== '5.0.0' || l.version !== p.version || l.packages[''].version !== p.version) process.exit(1)"
npm ci
npm run build:website
npm run test:website:e2e -- e2e/website/docs.spec.ts e2e/website/home.spec.ts --project=chromium
```

Expected: `5.0.0` renders with the default install command and unpublished qualifiers.

- [ ] **Step 5: Commit the candidate**

```bash
git add package.json package-lock.json CHANGELOG.md website/content/evidence.ts docs/releases/v5.0.0-signoff.md
git commit -m "chore: prepare version 5.0.0"
```

---

### Task 4: Verify and open the preparation PR into `v5`

**Files:**

- Modify after evidence: `docs/releases/v5.0.0-signoff.md`
- Review: `origin/v5...HEAD`

**Interfaces:**

- Consumes: prepared candidate.
- Produces: reviewed preparation PR with reproducible evidence.

- [ ] **Step 1: Run every local gate**

```bash
npm ci
npm run release:check
npm run test:e2e
npm run test:website:e2e
npm audit --json
```

Expected: every browser project passes; production advisories are blocking and development advisories are explicitly triaged.

- [ ] **Step 2: Record local evidence and commit**

Mark local readiness and packed-consumer evidence complete, retaining GitHub and post-promotion items unchecked. Then:

```bash
git add docs/releases/v5.0.0-signoff.md
git commit -m "docs: record version 5 stable candidate evidence"
```

- [ ] **Step 3: Obtain independent review**

Review `origin/v5...HEAD` against the design and plan. Fix every Critical or Important finding test-first and repeat review until approved.

- [ ] **Step 4: Run final verification on the reviewed commit**

```bash
npm run release:check
npm run test:e2e
npm run test:website:e2e
actionlint .github/workflows/ci.yml .github/workflows/release.yml
git diff --check origin/v5...HEAD
```

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin release/v5-stable-preparation
gh pr create --base v5 --head release/v5-stable-preparation --title "chore: prepare version 5 stable release" --body-file /tmp/v5-stable-preparation-pr.md
```

The body summarizes ancestry, metadata, release copy, evidence, verification, and advisory triage without claiming publication. Wait for quality, all browser jobs, and Vercel; ask the maintainer to merge.

---

### Task 5: Promote `v5` to protected `main`

**Files:** None; this task promotes the reviewed tree.

**Interfaces:**

- Consumes: merged stable preparation on `v5`.
- Produces: version 5 on `main`.

- [ ] **Step 1: Confirm merge and ancestry**

```bash
git fetch origin --prune
PREPARATION_PR=$(gh pr list --state merged --head release/v5-stable-preparation --base v5 --json number --jq '.[0].number')
test -n "$PREPARATION_PR"
gh pr view "$PREPARATION_PR" --json state,mergeCommit
git merge-base --is-ancestor origin/main origin/v5
```

- [ ] **Step 2: Open the promotion PR**

```bash
gh pr create --base main --head v5 --title "feat: release version 5" --body-file /tmp/v5-promotion-pr.md
```

The body identifies the breaking React 19 release, migration path, evidence, prepared npm state, and post-merge release sequence. Wait for required checks and Vercel; ask the maintainer to merge. Do not publish yet.

---

### Task 6: Verify production and land stable sign-off

**Files:**

- Modify on a new branch from `main`: `docs/releases/v5.0.0-signoff.md`

**Interfaces:**

- Consumes: promoted production deployment and external configuration.
- Produces: exact signed-off `main` commit eligible for publication.

- [ ] **Step 1: Create an isolated sign-off worktree**

```bash
git fetch origin --prune
git worktree add .worktrees/release-v5-stable-signoff -b release/v5-stable-signoff origin/main
```

- [ ] **Step 2: Verify production**

Check successful responses and content for `/`, `/docs/installation/`, `/docs/api/`, `/examples/basic/`, `/examples/custom-portal/`, `/robots.txt`, `/sitemap.xml`, and `/opengraph-image`. Confirm rendered `5.0.0`, prepared-not-published wording, and representative sheet interaction.

- [ ] **Step 3: Verify external protection**

Confirm npm trusted publishing targets this repository and release workflow. Confirm the GitHub `npm` environment restricts branches to `main` and `v5`, retains the maintainer reviewer, disallows admin bypass, and permits the configured solo-maintainer self-review exception.

- [ ] **Step 4: Complete and land sign-off**

Mark GitHub checks, production, and external protection complete with dates and precise outcomes. Then:

```bash
npm ci
npm run release:check
git add docs/releases/v5.0.0-signoff.md
git commit -m "docs: record version 5 stable sign-off"
git push -u origin release/v5-stable-signoff
gh pr create --base main --head release/v5-stable-signoff --title "docs: record version 5 stable sign-off" --body-file /tmp/v5-stable-signoff-pr.md
```

Wait for checks and ask the maintainer to merge. Do not publish from the branch.

---

### Task 7: Publish and verify stable `5.0.0`

**Files:** None during publication.

**Interfaces:**

- Consumes: exact signed-off `origin/main` and explicit maintainer authorization.
- Produces: npm `latest` `5.0.0` and GitHub release `v5.0.0`.

- [ ] **Step 1: Confirm immutable preconditions**

```bash
git fetch origin --prune
npm view @nipe-solutions/react-spring-bottom-sheet@5.0.0 version
npm view @nipe-solutions/react-spring-bottom-sheet dist-tags --json
```

Expected: exact version is absent, `latest` is `4.1.0`, and `next` is `5.0.0-alpha.0`.

- [ ] **Step 2: Dispatch the protected workflow**

```bash
gh workflow run Release --ref main -f version=5.0.0 -f channel=latest -f "confirmation=publish 5.0.0 with latest"
```

Resolve its run ID and prove its `headSha` equals `origin/main`. Wait for verification jobs, then approve the protected `npm` deployment without bypassing failures.

- [ ] **Step 3: Verify registry and GitHub outputs**

```bash
npm view @nipe-solutions/react-spring-bottom-sheet@latest version
npm view @nipe-solutions/react-spring-bottom-sheet@next version
gh release view v5.0.0 --json tagName,targetCommitish,isPrerelease,isDraft,publishedAt,url
```

Expected: `latest` is `5.0.0`, `next` remains the alpha, and `v5.0.0` is a public non-prerelease targeting the workflow commit. Verify npm provenance and a temporary clean React 19 consumer covering ESM, CommonJS, TypeScript, and stylesheet exports.

- [ ] **Step 4: Recover without republishing if necessary**

If npm accepted `5.0.0` before a later step failed, never rerun publication. Repair only missing verification or GitHub release state from the immutable commit.

---

### Task 8: Mark `5.0.0` available on the website

**Files:**

- Modify on a new branch from `main`: `website/content/release.test.ts`
- Modify: `website/content/release.ts`

**Interfaces:**

- Consumes: independently verified npm `latest` `5.0.0`.
- Produces: public stable install presentation without qualifiers.

- [ ] **Step 1: Create an isolated website worktree**

```bash
git fetch origin --prune
git worktree add .worktrees/docs-v5-stable-available -b docs/v5-stable-available origin/main
```

- [ ] **Step 2: Write and observe the failing test**

```ts
expect(getReleasePresentation('5.0.0').published).toBe(true)
```

```bash
npm run test:unit -- website/content/release.test.ts
```

Expected: FAIL because `5.0.0` is not in the public-version set.

- [ ] **Step 3: Add the verified version and run rendered checks**

Add `'5.0.0'` to `publishedVersions`, then run:

```bash
npm run test:unit -- website/content/release.test.ts
npm run test:website
npm run build:website
npm run test:website:e2e -- e2e/website/docs.spec.ts e2e/website/home.spec.ts --project=chromium
```

Expected: stable install copy has no prepared-release qualifier.

- [ ] **Step 4: Commit, review, and open the website PR**

```bash
git add website/content/release.ts website/content/release.test.ts
git commit -m "docs: mark version 5 as stable"
git push -u origin docs/v5-stable-available
gh pr create --base main --head docs/v5-stable-available --title "docs: mark version 5 as stable" --body-file /tmp/v5-stable-available-pr.md
```

Obtain independent review, wait for GitHub and Vercel checks, and ask the maintainer to merge.

---

### Task 9: Close the promotion program

**Files:** None unless a defect requires its own focused PR.

**Interfaces:**

- Consumes: merged website state and verified releases.
- Produces: final evidence and clean owned workspaces.

- [ ] **Step 1: Verify final external state**

```bash
git fetch origin --prune
npm view @nipe-solutions/react-spring-bottom-sheet dist-tags --json
gh release view v5.0.0 --json isPrerelease,isDraft,publishedAt,url
gh pr list --state open --limit 20
```

Confirm the production site renders `5.0.0` as available and representative documentation, examples, legal pages, and sheets work.

- [ ] **Step 2: Clean only owned merged workspaces**

For each promotion worktree, require clean status and prove its commit is an ancestor of its protected target before removal. Delete its merged local branch. Leave `.worktrees/v5-styling` and unrelated workspaces untouched.

- [ ] **Step 3: Report exact completion evidence**

Report npm tags, GitHub release URL, production domain, merged PRs, tested browser projects, clean-consumer result, and any intentionally retained branch.
