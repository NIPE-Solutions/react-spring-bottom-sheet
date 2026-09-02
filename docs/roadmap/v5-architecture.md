# Version 5 Architecture

Date: 2026-09-02
Status: Approved design

## Purpose

Version 5 is a ground-up modernization of the library for React 19 and modern evergreen browsers. It preserves the project's focus on bottom sheets while replacing the tightly coupled legacy implementation with a composable public API and independently testable subsystems.

Version 4 remains available for applications that require React 16.14, 17, or 18. Version 5 does not attempt to preserve the version 4 API.

## Platform support

- React 19
- Node.js 24 LTS for development, CI, and releases
- Current evergreen Chromium, Firefox, and WebKit browsers
- TypeScript consumers using the package's generated declarations

The exact browser support policy will be published in the README and package metadata. Compatibility is verified with real-browser and packaged-consumer tests.

## Design principles

- Own the sheet behavior and public API rather than wrapping another drawer component.
- Keep the public contract independent of animation, gesture, and styling implementations.
- Use domain-oriented modules with narrow responsibilities and dependency direction.
- Prefer pure calculations and deterministic state transitions.
- Provide accessible behavior by default in every supported interaction mode.
- Make every visible element replaceable and completely restylable.
- Add abstractions only when they clarify multiple concrete use cases.
- Treat documentation, examples, package output, and deployment as release artifacts.

## Public API

The primary API uses compound components:

```tsx
import { Sheet } from '@nipe-solutions/react-spring-bottom-sheet'

function Filters() {
  const [open, setOpen] = useState(false)
  const [snapPoint, setSnapPoint] = useState('compact')

  return (
    <Sheet.Root
      open={open}
      onOpenChange={setOpen}
      snapPoints={[
        { id: 'compact', value: 0.4 },
        { id: 'expanded', value: 0.9 },
      ]}
      activeSnapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
    >
      <Sheet.Trigger>Filters</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.Backdrop />
        <Sheet.Viewport>
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>Filters</Sheet.Title>
            <Sheet.Description>Refine the displayed results.</Sheet.Description>
            {/* Application content */}
            <Sheet.Close>Apply</Sheet.Close>
          </Sheet.Content>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  )
}
```

The initial primitive set is:

- `Sheet.Root`
- `Sheet.Trigger`
- `Sheet.Portal`
- `Sheet.Backdrop`
- `Sheet.Viewport`
- `Sheet.Content`
- `Sheet.Handle`
- `Sheet.Title`
- `Sheet.Description`
- `Sheet.Close`

An optional `BottomSheet` convenience component composes the same primitives for straightforward use cases. It does not introduce a second implementation.

Direction variants, side drawers, and a proprietary theme system are outside the scope of 5.0.

### State conventions

Open state and snap-point state follow the standard controlled and uncontrolled conventions:

- `open`, `defaultOpen`, and `onOpenChange`
- `activeSnapPoint`, `defaultSnapPoint`, and `onSnapPointChange`

State-change callbacks include structured details. Open changes distinguish trigger activation, close activation, Escape, backdrop interaction, dragging, and imperative changes. The callback order and the effect of controlled overrides are part of the documented contract.

Snap points use stable application-defined IDs. Supported values are viewport fractions, CSS pixel or percentage lengths, and content height:

```ts
type SnapPoint =
  | { id: string; value: number }
  | { id: string; value: `${number}px` | `${number}%` }
  | { id: string; value: 'content' }
```

Public component types support refs, standard DOM properties, `className`, `style`, and `asChild` composition. Internal dependency types are never exported.

## Internal architecture

The implementation is divided into four behavioral layers behind the React components:

```text
Public components
       |
       v
Sheet controller and state machine
       |
       +---------------+----------------+
       |               |                |
       v               v                v
Gesture engine    Layout engine    Accessibility
       |               |                |
       +---------------+----------------+
                       |
                       v
                 Motion adapter
                       |
                       v
                DOM and CSS variables
```

The proposed source layout is:

```text
src/
|-- components/
|-- controller/
|-- gestures/
|-- layout/
|-- accessibility/
|-- motion/
|-- context/
|-- styles/
`-- index.ts
```

Components compose the system and coordinate React lifecycles. They do not own snap calculations, gesture decisions, or transition algorithms. The controller does not import React or component modules. DOM access is isolated behind adapters and hooks.

### Controller

The controller uses explicit lifecycle states:

```text
closed -> opening -> open -> dragging -> settling
   ^                  |          |
   `---- closing <----+----------'
```

Opening, closing, dragging, resizing, and snapping are controller events. Controlled property updates may interrupt any transition without leaving stale state. State transitions and invariants are exhaustively checked and independently testable.

### Gestures and scrolling

Pointer input is normalized into position, direction, and velocity. Scroll arbitration decides whether movement belongs to nested scrollable content or to the sheet. Content retains a gesture while it can scroll in that direction; the sheet takes over at the relevant boundary. The handle always controls the sheet.

During a sheet drag, the layout engine constrains movement and applies controlled resistance beyond the valid range. Position variables update without requiring a React render for every pointer event. On release, position, direction, and velocity determine the destination snap point.

Pointer capture and other temporary state are released on cancellation, window blur, unmount, and multi-touch interruption.

### Layout and snap points

The layout engine resolves snap points after measuring the viewport, safe areas, virtual keyboard, and content. It normalizes invalid, duplicate, and unreachable points deterministically. If an active point disappears after a resize, the nearest valid point is selected.

All measurements and conversions are isolated from React components. Pure snap-point and destination calculations receive direct unit coverage.

### Motion

The library may use one focused animation dependency for scheduling and interpolation. It is hidden behind an internal adapter and none of its types, values, callbacks, or terminology enter the public API.

The sheet state machine, snapping policy, gestures, scroll coordination, accessibility behavior, and styling contract remain owned by this project. Replacing the motion engine must not require a consumer migration.

Reduced-motion mode preserves the same lifecycle and callback ordering while completing transitions immediately or with minimal motion.

## Accessibility

Modal sheets provide:

- Dialog semantics and accessible naming
- Initial focus, focus containment, and focus restoration
- Optional Escape-key dismissal
- Background interaction isolation
- Screen-reader-safe portal behavior
- Correct behavior with nested overlays
- Keyboard operation that does not depend on drag gestures
- Reduced-motion support

Non-modal sheets preserve normal page interaction and do not apply modal focus trapping or background hiding.

Missing accessible names, invalid snap points, and conflicting controlled properties produce concise development warnings. Recoverable input is normalized without production logging. Consumer callback failures must not corrupt internal state.

Cleanup always releases pointer capture, scroll locks, observers, listeners, and temporarily modified DOM attributes, including after interruption or unmount.

## Styling contract

Every visible primitive is independently styleable. Library-owned identifiers use the `rsbs` namespace:

- Classes: `rsbs-root`, `rsbs-backdrop`, `rsbs-content`
- CSS variables: `--rsbs-position`, `--rsbs-progress`, `--rsbs-safe-area-bottom`
- Data attributes: `data-rsbs-root`, `data-rsbs-state`, `data-rsbs-dragging`

Library styles never use global element rules or generic selectors such as `.content` or `[data-state='open']`. User-provided classes are additive and are never interpreted internally.

Styles are distributed in separate layers:

```tsx
// Required positioning, visibility, and interaction mechanics
import '@nipe-solutions/react-spring-bottom-sheet/core.css'

// Optional surface, backdrop, handle, radius, and shadow defaults
import '@nipe-solutions/react-spring-bottom-sheet/theme.css'

// Convenience entry that includes both layers
import '@nipe-solutions/react-spring-bottom-sheet/styles.css'
```

Both layers use low-specificity, namespaced selectors. The core layer contains no visual theme. The optional theme can be overridden or omitted without breaking behavior.

The styling contract supports ordinary CSS, CSS Modules, Tailwind, CSS-in-JS, inline styles, dark mode, high contrast, safe areas, and responsive layouts. Motion customization uses library-neutral configuration.

A lint rule and focused tests prevent unscoped selectors and public identifiers from entering the package.

## Naming and code organization

Domain terminology is consistent throughout the public and internal code:

- `Content` identifies the sheet surface.
- `Backdrop` identifies the page overlay.
- `activeSnapPoint` identifies the selected snap point.
- `dismissReason` identifies why closing was requested.
- `transitionPhase` identifies lifecycle progress.

Catch-all modules such as `utils.ts` are not used. Shared code lives beside its domain and is named for its purpose. Files, hooks, contexts, and components remain small enough to understand independently. Comments document non-obvious constraints and decisions rather than restating code.

Public APIs receive TSDoc. Architectural decisions with lasting consequences are recorded in short, conventional decision documents.

## Testing and quality gates

The verification strategy includes:

- Unit tests for snap calculations, velocity decisions, transitions, and invariants
- Component tests for controlled and uncontrolled state, focus, callbacks, portals, and cleanup
- Automated accessibility assertions and manual screen-reader verification before stable releases
- Playwright scenarios for mouse, touch emulation, keyboard use, scrolling, resizing, and interrupted animation
- Current Chromium, Firefox, and WebKit coverage
- React 19 Strict Mode coverage
- Type-level tests for accepted and rejected public API usage
- Package tests that install the generated tarball into clean consumers
- Website builds and executable example checks
- Bundle-size monitoring
- Linting, formatting, type checking, and namespaced-style enforcement

CI runs on Node.js 24 LTS. All required checks must pass before merging or publishing.

## Documentation website

The existing Next.js website remains in this repository and is modernized alongside the library. Interactive examples import the local library source so examples and implementation cannot drift apart.

The website covers:

- Introduction and installation
- Component anatomy
- State and lifecycle
- Snap points
- Gestures and scrolling
- Accessibility
- Styling and animation
- Examples, including fully custom designs
- API reference
- Migration from version 4
- Troubleshooting

The README becomes a concise entry point with installation, a minimal example, support policy, documentation link, and contribution links. It does not duplicate the full website.

Vercel under the NIPE Solutions organization is the official deployment target. Pull requests receive preview deployments. Production deploys from `main` only after required checks pass. The canonical address remains `https://react-spring-bottom-sheet.nipesolutions.com`.

Deployment credentials and domain ownership stay in Vercel. No deployment secrets are committed to the repository.

## Delivery and releases

Work is delivered through independently reviewable branches and pull requests. Changes are developed in isolated worktrees and are never pushed directly to `main`.

The implementation should be staged so foundational contracts land before dependent components and documentation. Each pull request includes tests appropriate to its layer and leaves the branch in a releasable state.

Version 5 will be validated through `5.0.0-alpha.x` and `5.0.0-beta.x` releases before the stable release. Release notes and a dedicated migration guide describe every intentional incompatibility with version 4. Semantic versioning governs subsequent public API changes.

## Project lineage

The GitHub repository remains in the `JasGH/react-spring-bottom-sheet` fork network. Version 5 is a continuation of that project even though its implementation and public API are substantially redesigned.

The original copyright and MIT license notices are preserved. The README credits the original project and maintainers, explains that this fork is independently maintained by NIPE Solutions, and links to the upstream repository. Package metadata continues to credit the original authors alongside current maintainers.

## Success criteria

Version 5 is ready for a stable release when:

- The compound API and styling contract are documented and covered by type tests.
- Modal and non-modal behavior satisfy the accessibility requirements.
- Dragging, nested scrolling, snapping, resizing, interruption, and cleanup pass supported-browser tests.
- Consumers can use the default theme or completely replace it without selector collisions.
- The packed library works in a clean React 19 application.
- The README, website, API reference, examples, and migration guide describe the shipped behavior.
- The repository, license, package metadata, and README preserve the project's original lineage and attribution.
- CI, preview deployments, production deployment, and prerelease publishing are operational.
- No underlying motion implementation appears in the public contract.
