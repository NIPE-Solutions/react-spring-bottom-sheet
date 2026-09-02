# Version 5 public API reference implementation plan

## Goal

Generate the version 5 API structure from compiled TypeScript declarations, join it with maintained explanations, and publish a complete responsive reference whose coverage is enforced by CI.

## Architecture

The TypeScript compiler API reads `dist/index.d.ts` and emits deterministic structural data. Maintained content supplies descriptions, defaults, and behavior. The website joins both at build time and renders static HTML; no compiler code ships to the browser.

## Technology

TypeScript 6 compiler API, Node.js test runner, React 19, Next.js static export, and Playwright.

## Design

`docs/roadmap/v5-api-reference-design.md`

## Global constraints

- Do not change the version 5 runtime or type API.
- Do not add a parser or documentation dependency.
- Keep generated output deterministic and checked into the repository.
- Keep editorial descriptions maintained in source rather than generated.
- Preserve static export, keyboard access, and 320 CSS pixel support.
- Use only `docs-*` classes and `--docs-*` properties in website code.

## Task 1: Declaration extractor

**Files**

- Create: `scripts/extract-public-api.mjs`
- Create: `scripts/extract-public-api.test.mjs`

**Produces**

```js
extractPublicApi({ declarationFile, projectRoot })
serializePublicApi(entries)
```

The extractor returns entries with `id`, `name`, `kind`, `signature`, `source`, and optional `members`. It follows aliases from `dist/index.d.ts`, expands the compound `Sheet` value, includes package-owned type members, and leaves inherited React DOM attributes summarized in their signature.

- [ ] Write a fixture test with a re-exported component, compound namespace, interface, and union. Assert literal names, kinds, signatures, required flags, and source paths.
- [ ] Run `node --test scripts/extract-public-api.test.mjs`; confirm it fails because the extractor does not exist.
- [ ] Implement `createProgram`, `getTypeChecker`, module export lookup, alias resolution with `getAliasedSymbol`, and stable type formatting.
- [ ] Run the extractor test and confirm the fixture passes.
- [ ] Add a deterministic serialization test that calls extraction twice and compares exact JSON including the trailing newline.
- [ ] Add failure tests for a missing declaration root, unsupported exported symbol, duplicate normalized identifier, and an incomplete `Sheet` namespace.
- [ ] Implement actionable errors and explicit presentation ordering for the package’s known exports.
- [ ] Run `node --test scripts/extract-public-api.test.mjs` and confirm all extractor tests pass.

## Task 2: Generated manifest and check mode

**Files**

- Modify: `scripts/extract-public-api.mjs`
- Create: `website/generated/public-api.json`
- Modify: `package.json`

**Produces**

```sh
node scripts/extract-public-api.mjs --write website/generated/public-api.json
node scripts/extract-public-api.mjs --check website/generated/public-api.json
```

- [ ] Add CLI tests that run the extractor against a temporary declaration fixture and assert that `--write` creates the expected file.
- [ ] Add a CLI test that changes the generated file and asserts `--check` exits non-zero with an outdated-artifact message.
- [ ] Run the focused test and confirm both cases fail before CLI handling exists.
- [ ] Implement argument parsing, atomic write behavior, and in-memory comparison for check mode.
- [ ] Add `generate:api` and `test:api` scripts. Ensure `test:api` runs extractor tests and checks the real manifest after `build:dist`.
- [ ] Run `npm run build:dist`, generate `website/generated/public-api.json`, and inspect every exported entry against `src/index.ts`.
- [ ] Run `npm run test:api` twice and confirm the second run leaves no diff.

## Task 3: Maintained content and coverage validation

**Files**

- Create: `website/content/reference/public-api.ts`
- Create: `website/content/reference/public-api.test.ts`

**Produces**

```ts
interface PublicApiContent {
  summary: string
  members?: Readonly<Record<string, PublicApiMemberContent>>
  notes?: readonly string[]
}

validatePublicApiContent(entries, content): readonly string[]
```

- [ ] Write tests with literal generated fixtures proving that missing entry content, missing member descriptions, unknown content keys, and stale member keys return precise validation errors.
- [ ] Run `npx vitest run website/content/reference/public-api.test.ts`; confirm it fails because the module does not exist.
- [ ] Implement the content types and a pure coverage validator.
- [ ] Run the focused test and confirm the validation behavior passes.
- [ ] Add maintained content for `Sheet`, every `Sheet.*` primitive, `BottomSheet`, every exported prop type, `OpenChangeDetails`, `OpenChangeReason`, `SnapPoint`, and `SnapPointValue`.
- [ ] Include runtime defaults for `open`, `snapPoints`, `modal`, and `dismissible`, plus concise notes for controlled state, dismissal reasons, focus, portals, and reduced motion.
- [ ] Add a test against the real generated JSON and confirm it reports zero coverage errors.

## Task 4: Reference components and route

**Files**

- Create: `website/components/ApiTable.tsx`
- Create: `website/content/reference/behavior.tsx`
- Create: `website/content/reference/index.ts`
- Modify: `website/app/docs/[slug]/page.tsx`
- Modify: `website/app/site.css`
- Modify: `website/content/docs.ts`

**Produces**

```tsx
<ApiTable entry={entry} content={content} />
<ApiReference />
```

- [ ] Add browser expectations for the API route: composition heading, `Sheet.Root` prop table, `OpenChangeReason` signature, `BottomSheet` section, source link, and a recipe link.
- [ ] Add a 320-pixel assertion that the page has no document-level horizontal overflow.
- [ ] Run the focused Chromium API tests and confirm they fail against the generic reference page.
- [ ] Implement `ApiTable` with a caption, semantic headers, code-formatted signatures, required/optional state, default values, and maintained descriptions.
- [ ] Implement `ApiReference` sections for composition, primitives, convenience API, public types, and behavioral guarantees.
- [ ] Add `getReferenceGuide` and make the documentation route select it for `api` while retaining generic fallback pages.
- [ ] Update API page headings in the documentation registry so on-page navigation matches rendered sections.
- [ ] Add responsive `docs-*` styles. Keep signature scrolling local to table cells and convert dense rows into labeled blocks where needed on narrow screens.
- [ ] Link relevant sections to controlled state, custom portal, reduced motion, confirmation, and snap-point recipes.
- [ ] Run focused browser tests and the existing accessibility scan; confirm they pass.

## Task 5: Repository quality gate

**Files**

- Modify: `scripts/verify-website.test.mjs`
- Modify: `package.json`
- Modify: `e2e/website/docs.spec.ts`

- [ ] Add a static verification test requiring the generated API artifact, maintained content module, and reference renderer.
- [ ] Run `npm run test:website`; confirm the new verification fails before the quality gate is wired.
- [ ] Place `build:dist` before `test:api` in `npm run check`, then retain size, package, and website builds after the API check.
- [ ] Make `build:website` regenerate the API manifest after building declarations and before invoking Next.js.
- [ ] Run `npm run check` and fix only failures caused by this slice.
- [ ] Run `npm run test:website:e2e -- --project=chromium --project=firefox`.
- [ ] Run `node scripts/extract-public-api.mjs --check website/generated/public-api.json` and `git diff --check`.
- [ ] Scan maintained text and history-bound artifacts for prohibited tooling attribution before committing.
- [ ] Commit the implementation and open a pull request from `feat/v5-api-reference` to `v5`.

## Completion criteria

- Every public export and package-owned member is represented in generated data.
- Every generated entry and member has maintained explanatory coverage.
- Regeneration is deterministic and a stale artifact fails the quality gate.
- The API page is useful without reading source code and links to runnable examples.
- The reference is accessible and contained at 320 CSS pixels.
- The complete repository and browser checks pass.
