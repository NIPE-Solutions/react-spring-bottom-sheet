# Example workbench and shared code presentation

## Purpose

Make examples feel like a focused laboratory instead of a long documentation
page, while giving every substantial code sample on the website consistent,
accurate syntax highlighting. Preserve the static-export architecture, the
existing public package API, and the stable recipe iframe during device changes.

## Outcomes

- The documentation page named “Examples” contains an explicit call to action
  to open the example laboratory at `/examples/`.
- Each recipe page gives the interactive device preview visual priority.
- Recipe source opens on demand in a right-side inspector on wide screens and a
  full-viewport inspector on compact screens.
- Documentation and homepage block snippets use the same server-rendered code
  system as recipe source.
- Changing device or orientation keeps the current document scroll position.
- TSX highlighting distinguishes React/JSX constructs clearly without copying
  a third-party editor theme or adding highlighting code to the client bundle.

## Information architecture

The recipe header remains concise: route, title, summary, and the link back to
all recipes. The laboratory follows immediately. Its heading row owns a
prominent `View source` action, so the relationship between the running example
and its implementation is explicit.

Prerequisites, behavior, and accessibility guidance form one restrained notes
region below the laboratory. They remain ordinary document content and
therefore stay searchable, linkable, and available without opening an overlay.
Related documentation remains the final navigation region.

The generic Examples documentation entry keeps its explanatory copy and adds a
clear `Open the example laboratory` link. It must not rely on readers noticing
the global header link.

## Source inspector

The source inspector overlays the page rather than changing the document grid.
This prevents the device preview from shrinking, reflowing, or losing its
current state when source is opened.

On wide screens it enters from the inline end as a drawer sized for readable
code, capped so part of the underlying laboratory remains visible. On compact
screens it occupies the viewport. It has a quiet backdrop and one deliberate
open/close motion; reduced-motion users get an immediate state change.

The inspector is a modal dialog with:

- a visible title, filename, language, copy action, and close action;
- initial focus on the close action;
- focus containment while open;
- `Escape` dismissal;
- focus restoration to the `View source` trigger;
- background interaction suppression;
- internal vertical and horizontal scrolling without body-scroll leakage.

Source is closed by default. Opening it does not alter the URL because it is a
temporary inspection state rather than shareable recipe state. Device and
orientation query parameters remain shareable.

The highlighted token tree stays server-rendered. A small client shell owns only
dialog state, focus behavior, and copy feedback. The canonical source string is
still the sole input for display and copying.

## Shared code-block system

Introduce a server-rendered `CodeBlock` component for substantial examples.
It accepts exact source text, a supported language, and optional presentation
metadata such as filename, line numbers, and copy capability. It delegates to a
language-aware highlighter and renders tokens as React nodes; it never injects
highlighted HTML.

Initial supported languages are:

- `tsx` for React and TypeScript examples;
- `css` for styling examples;
- `shell` for install and registry commands.

The recipe inspector uses the same rendering primitive with filename, line
numbers, and copy enabled. Homepage and documentation snippets use the smallest
appropriate chrome: commands do not need line numbers, while multiline TSX and
CSS examples do. Inline `code` remains a separate lightweight typographic
treatment and is not passed through Shiki.

All existing block-level `pre > code` snippets on the homepage and in docs are
migrated. No duplicate source strings are introduced for recipe files.

## Highlighting language

Keep a custom dark palette derived from the website’s cool blue, violet, green,
and amber signals. Increase semantic separation instead of increasing visual
noise. TSX scopes must distinguish at minimum:

- JSX component and intrinsic element names;
- JSX attributes and object properties;
- language keywords and storage modifiers;
- functions and calls;
- types and interfaces;
- strings, numbers, and constants;
- comments;
- punctuation and braces.

CSS selectors, properties, values, strings, numbers, and comments receive the
same semantic hierarchy. Shell commands distinguish executables, flags,
strings, variables, and comments. Comments may be italic; ordinary source text
must remain upright. Every token and UI control must meet the site’s contrast
requirements.

The code surface uses the project’s established squared, technical visual
language: a deep neutral manuscript, restrained one-pixel rules, tabular line
numbers, and no decorative traffic-light controls or imitation editor branding.

## Scroll-preserving device state

The observed jump originates at query navigation: Next.js App Router navigation
scrolls by default, and `DeviceLab` currently calls `router.push` and
`router.replace` without overriding it.

Both user-driven device changes and automatic normalization pass
`{ scroll: false }`. Browser history remains intact for user changes, the iframe
identity remains stable, and the existing morph interruption/rollback behavior
is unchanged. No manual `window.scrollTo` restoration is used.

## Components and boundaries

- `CodeBlock` is the public website-level server component for block snippets.
- The highlighter module owns supported languages, singleton construction, and
  the custom theme.
- A token renderer owns exact whitespace, native selection, optional line
  numbers, and accessible labels.
- `SourceInspector` owns client dialog behavior and composes the rendered code
  plus the existing copy control.
- `RecipePreview` exposes the source trigger beside the laboratory heading.
- `DeviceLab` remains responsible only for device selection, URL state, iframe
  readiness, and morph coordination.

These are website-internal contracts. No exported library component or type is
changed.

## Responsive behavior

- Wide recipe pages use one centered laboratory column; source no longer forms
  a permanent second grid column.
- The wide drawer leaves a recognizable portion of the page visible and caps
  code line length through its viewport, not by wrapping source.
- At the compact breakpoint, the inspector fills the available viewport and
  accounts for safe-area insets.
- Code always scrolls horizontally; source text never wraps or forces document
  overflow.
- At 320 CSS pixels, controls remain reachable and no page-level horizontal
  scrollbar is introduced.

## Failure handling

- If highlighting fails during build, the build fails rather than silently
  publishing misleading or incomplete source.
- Copy failures retain the existing explicit recovery message and native
  selection fallback.
- The inspector remains closable and focus-restoring even if copying fails.
- Device navigation rollback retains its existing bounded timeout; disabling
  scroll must not change that state machine.

## Verification

Use test-driven implementation with focused red/green coverage before broad
gates.

Unit and render tests verify:

- language loading and singleton highlighter reuse;
- exact source and trailing-newline preservation for TSX, CSS, and shell;
- meaningful token distinctions for each supported language;
- optional filename, line-number, and copy presentation;
- every former block snippet is migrated to `CodeBlock`;
- the Examples documentation call to action targets `/examples/`;
- dialog naming, focus entry, containment, Escape dismissal, restoration, and
  reduced-motion behavior;
- both device navigation calls use the non-scrolling option.

Browser tests verify in Chromium, Firefox, and CI WebKit:

- opening and closing the inspector preserves the live iframe and sheet state;
- source is exact, selectable, copyable, and horizontally contained;
- the drawer/full-screen breakpoint behavior and 320-pixel containment;
- device and orientation changes preserve `scrollY`, focus, iframe identity,
  query parameters, and morph behavior;
- homepage and docs snippets contain server-rendered highlighted tokens with no
  hydration errors;
- keyboard and accessibility checks remain clean.

The final repository gate is `npm run check`, followed by the complete website
browser matrix and inspection of static output to prove that Shiki and its
grammar engines are absent from client JavaScript.

## Delivery

This is a follow-up to the highlighted canonical recipe source change. It ships
as a separate feature branch and pull request after that dependency is merged.
CI WebKit is mandatory before merge because the pinned local macOS WebKit binary
cannot start in the current environment.
