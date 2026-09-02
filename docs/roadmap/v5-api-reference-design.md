# Version 5 public API reference design

## Goal

Publish a complete, readable reference for the version 5 package and make undocumented or stale API entries fail the repository quality gate.

## Principles

- Treat compiled declarations as the authority for names and TypeScript signatures.
- Keep explanations and behavioral guidance deliberately written and reviewable.
- Do not make the documentation site depend on the TypeScript compiler at runtime.
- Generate deterministic artifacts that produce no diff when the public surface is unchanged.
- Preserve the package API, static website export, and existing browser support.

## Architecture

The reference has three layers with distinct ownership:

1. `scripts/extract-public-api.mjs` reads `dist/index.d.ts` and its referenced declaration files through the TypeScript compiler API. It emits structural facts to `website/generated/public-api.json`.
2. `website/content/reference/public-api.ts` contains descriptions, defaults, and behavioral notes keyed by stable generated identifiers.
3. `website/content/reference/behavior.tsx` joins both sources and renders the API page through `ApiTable`.

The extraction script runs after `build:dist`. The generated JSON is checked into the repository so the static site can import it without running compiler analysis. A `--check` mode regenerates in memory and fails when the checked artifact differs.

## Generated contract

Each generated entry has this shape:

```ts
interface PublicApiEntry {
  id: string
  name: string
  kind: 'namespace' | 'component' | 'type'
  signature: string
  source: string
  members?: readonly PublicApiMember[]
}

interface PublicApiMember {
  name: string
  signature: string
  required: boolean
}
```

Top-level entries cover `Sheet`, `BottomSheet`, exported prop types, and public value types. The `Sheet` compound export is expanded into `Sheet.Root`, `Sheet.Trigger`, `Sheet.Portal`, `Sheet.Backdrop`, `Sheet.Viewport`, `Sheet.Content`, `Sheet.Handle`, `Sheet.Title`, `Sheet.Description`, and `Sheet.Close`. Object and interface types expose package-owned properties as members; unions retain a complete compact signature. Native React DOM attributes remain represented by the parent type in the signature rather than expanding into hundreds of framework-owned rows. `BottomSheetProps` includes inherited `SheetRootProps` members because those options are part of its direct public contract.

Identifiers are stable kebab-case names such as `sheet-root`, `bottom-sheet`, and `open-change-reason`. Source values are repository-relative paths such as `src/components/Root.tsx`. The website constructs GitHub links from those paths and the documented branch or release. Omitting line anchors keeps links correct when implementation details move without changing the API.

## Curated content contract

Every generated entry must have a matching record containing:

```ts
interface PublicApiContent {
  summary: string
  members?: Readonly<
    Record<
      string,
      {
        description: string
        defaultValue?: string
      }
    >
  >
  notes?: readonly string[]
}
```

The validation step rejects missing generated entries, missing member descriptions, and curated records that no longer correspond to the public surface. This keeps prose intentional without allowing it to drift from the declarations.

Defaults are curated because TypeScript declarations cannot reliably express runtime defaults. Callback and dismissal semantics remain prose because their guarantees are behavioral rather than syntactic.

## Extraction behavior

The extractor creates a TypeScript program rooted at `dist/index.d.ts`, obtains the module exports from the type checker, follows aliases, and formats public types with stable compiler flags. It normalizes whitespace and sorts entries by an explicit public presentation order rather than filesystem traversal order.

The script fails with actionable messages when:

- `dist/index.d.ts` is missing;
- an exported symbol cannot be classified;
- the compound `Sheet` export is missing an expected primitive;
- two entries normalize to the same identifier;
- checked output differs from the generated artifact.

No parser dependency is added; the repository already depends on TypeScript.

## Reference presentation

The API route becomes a purpose-built page rather than generic manifest paragraphs. It opens with the composition model, then presents:

1. `Sheet.Root` state, snap-point, modality, and dismissal props;
2. DOM primitives and their native-element contracts;
3. `BottomSheet` as the convenience composition;
4. public snap-point and open-change types;
5. behavioral guarantees for focus, portals, controlled state, reduced motion, and close transitions.

`ApiTable` renders semantic table markup on wide screens. A narrow-screen stylesheet preserves labels and values without horizontal page overflow. Signatures may scroll within their own cells, but the document itself must remain contained at 320 CSS pixels.

Every entry links to its source. Examples link to the existing runnable recipes rather than duplicating large code blocks.

## Quality gates

Unit tests use small declaration fixtures to prove:

- exported components and types are discovered;
- compound `Sheet` members are expanded;
- signatures and required members are stable;
- output is deterministic across repeated extraction;
- missing curated coverage is rejected;
- stale curated records are rejected;
- `--check` detects an outdated generated file.

Website tests verify semantic tables, working source and recipe links, keyboard navigation, and 320-pixel containment. The existing accessibility suite covers the completed API route.

The main `check` command builds declarations, checks the generated manifest, validates curated coverage, and builds the static site. A clean regeneration must leave the worktree unchanged.

## Scope

This slice does not change runtime exports, add new public props, introduce a documentation framework, or generate editorial prose. Search indexing and visual regression infrastructure remain in Slice 8.
