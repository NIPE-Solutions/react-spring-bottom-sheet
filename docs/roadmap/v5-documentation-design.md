# Version 5 documentation design

## Purpose

The version 5 website must help an application developer answer three questions in order:

1. Is this library suitable for a production interface?
2. Can I build a working sheet quickly?
3. Can I find the exact behavioral and API contract when the integration becomes more complex?

The site therefore serves as both the product homepage and the authoritative technical manual. It must communicate confidence through working software, precise writing, and reproducible evidence rather than broad superlatives.

## Direction

### Information hierarchy: live product first

The homepage opens with a real, keyboard-accessible sheet next to a concise explanation. The visitor can drag it, select snap points, close it, and reopen it without leaving the hero. Verified proof points follow immediately. A minimal installation example and representative use cases then lead into the documentation.

The primary path should support three speeds:

- Understand the value in approximately 30 seconds.
- Install and render a working sheet in approximately two minutes.
- Reach detailed guides and reference material without searching the repository.

### Visual character: motion instrument

The visual system takes its identity from the library itself: measured geometry, snap-point guides, motion trajectories, and an interactive surface. It uses cool neutral surfaces, a crisp blue accent, and disciplined sans-serif typography.

The live sheet is the single expressive element. Surrounding content remains quiet and technical. Decoration must communicate structure or behavior; the site does not use ornamental gradients, stock illustrations, floating shapes, generic feature-card grids, or repeated reveal animations.

Proposed core tokens:

| Token   | Value     | Role                                 |
| ------- | --------- | ------------------------------------ |
| Canvas  | `#f5f6f8` | Primary page background              |
| Surface | `#ffffff` | Reading and interactive surfaces     |
| Ink     | `#171a20` | Primary text                         |
| Muted   | `#596170` | Secondary text                       |
| Rule    | `#c9ced8` | Structural lines and measured guides |
| Signal  | `#3157d5` | Actions, focus, and active state     |

Final tokens must meet WCAG 2.2 AA contrast requirements. Typography should use a deliberately selected variable sans-serif with system fallbacks and a separate code face. Text remains left-aligned with prose capped near 72 characters.

## Content architecture

### Home

- Live component and one-sentence positioning
- Direct installation and documentation actions
- Verified support, test, typing, accessibility, and size evidence
- Minimal working example
- Representative patterns that link to runnable recipes
- Styling and accessibility guarantees
- Project status and version channel

### Learn

- Introduction
- Installation
- First sheet
- Controlled and uncontrolled state
- Component anatomy
- Snap points
- Gestures and nested scrolling
- Accessibility
- Styling and complete theme replacement
- Troubleshooting

### Recipes

Examples are organized by user task instead of component name. The initial set covers:

- Basic modal sheet
- Controlled open state
- Named and controlled snap points
- Content-height sheet
- Long, nested scrolling content
- Form and virtual-keyboard behavior
- Custom portal target
- Non-modal persistent panel
- Complete visual restyle
- Dark theme
- Reduced motion
- Confirmation and destructive-action flow

Each recipe has a stable URL, summary, prerequisites, live preview, copyable source, behavior notes, accessibility notes, and links to the relevant API.

### Reference

- Every public component and prop
- Callback details and change reasons
- Exported types
- CSS entry points
- CSS custom properties
- Stable classes and data attributes
- Behavioral guarantees and browser support

### Migration and project information

- Version 4 to version 5 mapping and upgrade checklist
- Release channels and compatibility policy
- Contributing and release documentation
- Architecture and maintenance policy
- Credits and project lineage

## Technical architecture

### Content registry

A typed content registry owns route metadata, navigation groups, descriptions, and ordering. Page components render from this registry but do not own global navigation data. Static generation derives routes, metadata, sitemap entries, and previous/next navigation from the same source.

Long-form content stays separate from presentation components. Structured data is used only where structure is valuable, such as route metadata and API tables; prose should remain comfortable to author and review.

### Shared recipe modules

A recipe is a first-class module containing:

- Stable identifier and route metadata
- Runnable React component
- Source displayed to readers
- Behavioral and accessibility notes
- Test selectors limited to the recipe boundary

The examples index, embedded documentation previews, and browser tests consume the same recipe implementation. Recipes import the package through its public entry point. They must never reach into library internals.

This makes a published example an executable contract: visible code, runtime behavior, and regression coverage cannot drift independently.

### Presentation boundaries

The site presentation layer contains the page shell, navigation, search, table of contents, code blocks, API tables, demo frames, and content typography. Site classes use a `docs-` prefix and live in the site CSS layer. Library-owned selectors and variables retain the `rsbs` namespace.

Examples may demonstrate the public `rsbs` styling contract, but site layout selectors must not target library internals. Complete-theme examples keep their CSS next to the recipe and under a recipe-specific namespace.

Interactive modules load only on pages that require them. Navigation, prose, source code, and API reference remain useful in the statically rendered document without client-side JavaScript.

### API reference

The reference should be derived from the exported TypeScript surface or a checked structured manifest. It must fail validation when public exports and documented exports diverge. Explanatory guidance remains hand-written; generated output is limited to signatures, defaults, and stable contracts that benefit from a single source of truth.

## Writing and claims

Copy uses plain language, active voice, and verifiable specifics. It describes what developers can build and how the library behaves. It avoids filler labels and unsupported claims.

Approved positioning themes include:

- Built for production interfaces
- Fully typed for React 19
- Tested in Chromium, Firefox, and WebKit
- Accessible dialog behavior by default
- Complete styling control with namespaced selectors
- A small compound API
- Approximately 10.5 kB gzip at the current alpha build

Size values must come from the bundle check and should be qualified by version. Browser claims must match the CI matrix. The site must not use “battle tested” or state unqualified production readiness until adoption and stable-release evidence support those claims.

## Navigation and search

Desktop documentation uses a persistent section navigation, a bounded reading column, an on-page table of contents, and previous/next links. Mobile uses a compact navigation control without turning the entire sidebar into a long horizontal strip.

Search uses a build-time index of titles, descriptions, headings, recipe metadata, component names, and prop names. It is keyboard accessible, preserves normal link behavior, and does not require a hosted search service for the initial release.

Stable routes and heading identifiers are part of the documentation contract. Restyling must not unnecessarily break external links.

## Quality contract

- Every recipe has a browser test for its defining behavior.
- Critical interactions run in Chromium, Firefox, and WebKit.
- Keyboard navigation, focus restoration, Escape, reduced motion, and accessible naming have dedicated coverage.
- Key pages and open-sheet states receive automated accessibility checks.
- Homepage, documentation shell, and representative sheet states receive visual regression coverage at desktop and mobile sizes.
- CI validates internal links, unique heading identifiers, recipe metadata, visible example source, and API-reference coverage.
- The existing JavaScript and CSS bundle budgets remain enforced.
- Lighthouse budgets protect loading performance, accessibility, and layout stability.
- Website changes receive a successful preview deployment before merge.

## Responsive and accessibility requirements

- The site supports keyboard-only use at every viewport.
- Focus is always visible and is never obscured by sticky navigation.
- Motion respects `prefers-reduced-motion`.
- Interactive examples have instructions that do not depend on pointer input.
- Code blocks scroll without forcing the page wider than the viewport.
- Navigation, tables, and live examples remain usable at 320 CSS pixels.
- Color never carries meaning alone.
- Heading order and landmark structure remain valid across page templates.

## Delivery boundaries

The redesign should ship as independently reviewable changes:

1. Foundation and design tokens
2. Typed content registry and documentation shell
3. Shared recipe contract and initial recipes
4. Homepage and evidence presentation
5. Expanded learning content
6. Complete public API and styling reference
7. Search, accessibility checks, visual regression, and performance budgets

Each change must leave the deployed website coherent and the existing public package API unchanged.
