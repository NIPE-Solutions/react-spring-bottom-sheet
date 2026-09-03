# Interactive Device Lab Design

## Summary

The examples section will present every runnable recipe inside an isolated phone or tablet viewport. Readers can switch device class and orientation without resetting the example, share the selected configuration through the URL, and inspect highlighted source that is guaranteed to match the running component.

The feature should feel like a precise testing instrument. The device transition is the primary visual gesture; the surrounding documentation remains restrained and keeps the bottom sheet itself as the focal point.

## Goals

- Run every recipe in a realistic, isolated browser viewport.
- Support phone and tablet presets in portrait and landscape orientations.
- Animate user-triggered device changes without reloading or resetting the recipe.
- Make device state shareable, testable, and compatible with browser history.
- Render accessible, project-specific TSX syntax highlighting at build time.
- Eliminate drift between the running example and its displayed source.
- Preserve static export, the current public package API, and the existing browser matrix.

## Non-goals

- A general-purpose online editor or executable code playground.
- Arbitrary device dimensions or user-provided preview URLs.
- Reproducing the chrome of VS Code or another editor.
- Wrapping prose-only documentation pages in device frames.
- Changing the library's public API to support the documentation site.

## Route architecture

Each recipe has a documentation route and a minimal embedded route:

- `/examples/[slug]/` renders the explanation, device lab, guidance, and source.
- `/examples/[slug]/embed/` renders only the runnable example and its compact application surface.

The embedded route uses the same allowlisted registry entry as the documentation route. It is same-origin so browser tests can inspect focus, portals, layout, and gestures. It must carry `noindex` metadata and must not render the site header, footer, or duplicate navigation.

The iframe receives a recipe-specific accessible title. Its source URL does not change when the selected device changes, so resizing the frame does not remount the document or reset an open sheet.

## Component architecture

The documentation route is composed from:

```text
DeviceLab
├── DeviceControls
├── DeviceFrame
│   └── RecipeEmbed
└── ViewportReadout

RecipeSource
├── SourceHeader
├── CopySourceButton
└── HighlightedCode
```

Responsibilities are deliberately separated:

- `DeviceLab` owns selected device state and URL synchronization.
- `DeviceControls` exposes semantic pressed buttons for device and orientation.
- `DeviceFrame` owns presentation, proportional scaling, and motion.
- `RecipeEmbed` owns iframe loading and fallback behavior.
- The embedded recipe owns its sheet state, document, focus, scrolling, and portals.
- `HighlightedCode` is a server component that performs build-time tokenization.
- `CopySourceButton` is the only client-side source-code control.

Device presets and their labels, logical dimensions, and frame characteristics live in one typed configuration object.

## Device state and URL behavior

The default configuration is phone portrait. The selected state is encoded as:

```text
?device=phone&orientation=portrait
```

Supported values are:

- `device`: `phone` or `tablet`
- `orientation`: `portrait` or `landscape`

Controls update the URL through normal navigation semantics so back and forward restore previous selections. Invalid or missing values fall back to phone portrait and are normalized without accepting arbitrary dimensions.

The embedded URL remains stable across configuration changes. An open sheet therefore remains mounted and adapts while its viewport changes.

## Viewport presets and scaling

Logical viewport dimensions are:

| Device |   Portrait |  Landscape |
| ------ | ---------: | ---------: |
| Phone  |  390 × 780 |  780 × 390 |
| Tablet | 820 × 1080 | 1080 × 820 |

The iframe retains the selected logical viewport dimensions. If the available documentation width cannot contain the device at full size, the complete frame scales proportionally. Scaling the presentation must not silently change the iframe's internal responsive breakpoint.

The device stage has no decorative grid. It uses a neutral background, restrained bezel, subtle depth, and only enough hardware detail to communicate orientation. A small readout identifies the device and exact viewport dimensions.

## Motion

Changing device or orientation animates frame width, height, corner radius, and bezel proportions. The transition is user-triggered and must not reload the iframe.

The motion should be calm and direct, without overshoot that distracts from the component demonstration. When `prefers-reduced-motion: reduce` is active, dimensions and frame styling change immediately.

The implementation must avoid animating document layout in a way that causes surrounding content to jump unpredictably. The stage reserves or smoothly updates the required presentation height.

## Recipe isolation

An iframe is preferred over injected portal targets because it gives every example a genuine document and viewport boundary. Default portals then target the embedded document body exactly as they do in a consumer application. Fixed positioning, focus containment, scrolling, resize observation, and viewport-relative sizing can be exercised without documentation-only changes to recipe code.

The custom-portal recipe retains its own application-owned portal target inside the embedded document. No internal portal context or alternate public API is introduced.

## Canonical source pipeline

The runnable recipe component file is the canonical source. The registry stores an allowlisted source-file reference alongside the component and metadata.

During static generation:

1. The server resolves the registered source path within the recipe directory.
2. It reads the exact component file.
3. Shiki tokenizes it as TSX using the project theme.
4. React renders static token spans and line numbers.
5. The raw source is passed only to the copy control.

The current manually maintained source-string modules are removed after all recipes use the canonical pipeline. Validation fails when a registered source path is absent, escapes its allowed directory, or no longer corresponds to its recipe.

Shiki is build-time infrastructure. Only the TSX grammar and the custom theme are loaded, and no highlighting runtime is shipped to the browser.

## Source presentation

The source block uses a distinct visual language derived from the existing website palette rather than mimicking a commercial editor. It includes:

- a concise filename label;
- an accessible copy button with status feedback;
- stable line numbers that are not included in text selection;
- selectable code with horizontal scrolling;
- a project-specific, high-contrast token palette;
- visible keyboard focus around the scrollable region.

There are no fake window controls, fake tabs, or decorative editor chrome. On wide layouts the source and device may form a balanced split view; on narrower layouts the source follows the preview.

## Accessibility

- Device and orientation selectors are ordinary buttons with `aria-pressed`.
- Labels remain visible and do not rely on icons alone.
- The viewport readout announces configuration changes through a polite live region.
- The iframe has a unique title based on the recipe.
- Device chrome is presentational and excluded from the accessibility tree where appropriate.
- Opening a modal recipe traps focus within the embedded document; closing restores focus to its embedded trigger.
- The parent documentation document is not incorrectly marked inert when an embedded sheet opens.
- Source token colors meet WCAG contrast requirements, and syntax meaning never depends on color alone.
- Reduced-motion preferences remove the device morph without removing state feedback.

## Loading and failure behavior

The frame presents a quiet loading state until the embedded document signals readiness. A failed or timed-out embed displays a useful message and a direct retry/open link. The fallback does not replace the iframe during ordinary device transitions.

Copy failures retain the existing selection-based fallback and provide textual status. Unsupported or invalid URL state falls back safely to a known preset.

## Responsive behavior

The lab uses the available content width rather than assuming a desktop viewport. Device controls wrap without horizontal overflow. The logical preview remains accurate while its visual representation scales down.

On wide documentation layouts, preview and source can share the row when both retain useful reading width. On compact layouts they stack in document order: controls, preview, guidance, source. No breakpoint may introduce horizontal page scrolling.

## Verification strategy

Automated coverage must verify:

- every registered recipe produces a documentation page and embedded page;
- the source displayed for each recipe matches its canonical component file;
- all four device configurations resolve from URL state;
- invalid query state normalizes to phone portrait;
- back and forward navigation restore selections;
- device changes preserve the iframe document and an open sheet;
- the iframe's internal viewport matches the selected logical dimensions;
- reduced motion disables interpolation;
- portals, backdrop transitions, focus restoration, scrolling, gestures, and custom portal ownership work inside the embed;
- device controls and source controls are keyboard accessible;
- representative configurations pass automated accessibility checks;
- static export, unit tests, type checking, linting, formatting, package verification, and the supported browser matrix remain green.

## Delivery slices

1. Add embedded recipe routes, registry source references, canonical source loading, and source-drift checks.
2. Add URL-backed device controls, isolated frames, proportional scaling, loading behavior, and motion.
3. Add the custom Shiki theme, responsive source layout, accessibility polish, and complete browser coverage.

Each slice is independently reviewable and must retain a green repository check before it is proposed for merge.
