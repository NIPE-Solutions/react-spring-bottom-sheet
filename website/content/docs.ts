import type { DocPage } from './types'

export const docs = [
  {
    slug: 'introduction',
    title: 'Introduction',
    description: 'Why the sheet exists and how version 5 is designed.',
    group: 'learn',
    order: 1,
    sections: [
      {
        id: 'dialog-behavior',
        title: 'A bottom sheet that behaves like a dialog',
        body: 'Version 5 combines a small compound API with owned gesture, layout, focus, and motion boundaries. It supports modal workflows, persistent non-modal panels, content-sized sheets, and explicit snap points.',
      },
      {
        id: 'deliberate-boundaries',
        title: 'Deliberate boundaries',
        body: 'The public contract does not expose the animation engine. Mechanical CSS is separate from the optional theme, and every owned selector uses the rsbs namespace.',
      },
    ],
  },
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Install the React 19 package and choose a stylesheet.',
    group: 'learn',
    order: 2,
    sections: [
      {
        id: 'package',
        title: 'Package',
        body: 'Install @nipe-solutions/react-spring-bottom-sheet with React 19 and React DOM 19.',
        code: 'npm install @nipe-solutions/react-spring-bottom-sheet',
      },
      {
        id: 'styles',
        title: 'Styles',
        body: 'Import styles.css for the complete default experience, or combine core.css with your own visual theme.',
        code: "import '@nipe-solutions/react-spring-bottom-sheet/styles.css'",
      },
    ],
  },
  {
    slug: 'anatomy',
    title: 'Component anatomy',
    description: 'Compose only the pieces your interface needs.',
    group: 'learn',
    order: 3,
    sections: [
      {
        id: 'compound-components',
        title: 'Compound components',
        body: 'Sheet.Root owns state. Trigger and Close request state changes. Portal, Backdrop, Viewport, Content, Handle, Title, and Description define the rendered interface.',
      },
      {
        id: 'convenience-composition',
        title: 'Convenience composition',
        body: 'BottomSheet provides the common portal, backdrop, viewport, content, handle, title, and description arrangement without creating a second implementation.',
      },
    ],
  },
  {
    slug: 'state',
    title: 'State and lifecycle',
    description:
      'Choose controlled or uncontrolled state without mixing contracts.',
    group: 'learn',
    order: 4,
    sections: [
      {
        id: 'open-state',
        title: 'Open state',
        body: 'Use defaultOpen for local state. Use open with onOpenChange when application state is authoritative. Change details identify trigger, close, escape, backdrop, drag, or imperative requests.',
      },
      {
        id: 'snap-state',
        title: 'Snap state',
        body: 'activeSnapPoint and onSnapPointChange form the controlled contract. defaultSnapPoint initializes the uncontrolled contract.',
      },
    ],
  },
  {
    slug: 'events',
    title: 'Events and dismissal',
    description:
      'Connect state changes to application logic without guessing why they happened.',
    group: 'learn',
    order: 5,
    sections: [
      {
        id: 'change-reasons',
        title: 'React to intent, not DOM events',
        body: 'onOpenChange reports the requested state and a stable reason: trigger, close, escape, backdrop, drag, or imperative. Use the reason for telemetry, routing, or workflow decisions without coupling application code to pointer and keyboard event details.',
        code: "onOpenChange={(nextOpen, details) => {\n  setOpen(nextOpen)\n  track('sheet_changed', { reason: details.reason })\n}}",
      },
      {
        id: 'prevent-dismissal',
        title: 'Make required decisions explicit',
        body: 'Set dismissible to false when closing would discard a decision that the user must make. Render clear actions with Sheet.Close, and avoid silently ignoring a normal dismiss request in controlled state because that makes the interface feel broken.',
      },
      {
        id: 'close-completion',
        title: 'Wait for the visual lifecycle',
        body: 'The sheet remains mounted while its closing motion completes, then restores focus to the initiating control. Coordinate application state through the public callbacks instead of timers tied to an assumed animation duration.',
      },
    ],
  },
  {
    slug: 'snap-points',
    title: 'Snap points',
    description: 'Name every destination and express its height clearly.',
    group: 'learn',
    order: 6,
    sections: [
      {
        id: 'values',
        title: 'Values',
        body: 'A snap point has a stable id and accepts a pixel number, a px string, a percentage of the viewport, or content.',
        code: "const snaps = [{ id: 'peek', value: '35%' }, { id: 'full', value: '90%' }]",
      },
      {
        id: 'reconciliation',
        title: 'Reconciliation',
        body: 'When layout changes, the active destination resolves again. If a destination disappears, the nearest valid point is selected.',
      },
    ],
  },
  {
    slug: 'gestures',
    title: 'Gestures and scrolling',
    description:
      'Drag the handle or content without competing with nested scroll.',
    group: 'learn',
    order: 7,
    sections: [
      {
        id: 'ownership',
        title: 'Ownership',
        body: 'Scrollable descendants keep a gesture while they can move in its direction. At a boundary, the sheet can take ownership of the remaining movement.',
      },
      {
        id: 'interruptions',
        title: 'Interruptions',
        body: 'Pointer cancellation, window blur, multi-touch, unmounting, and a new gesture all use the same cleanup path.',
      },
    ],
  },
  {
    slug: 'portals',
    title: 'Portals and layering',
    description:
      'Choose the sheet rendering boundary deliberately for pages, shells, and embedded surfaces.',
    group: 'learn',
    order: 8,
    sections: [
      {
        id: 'default-portal',
        title: 'Use the document boundary by default',
        body: 'Sheet.Portal renders into the document body by default so application layout, overflow, and stacking contexts do not accidentally clip a modal sheet. This is the right boundary for most page-level workflows.',
      },
      {
        id: 'custom-container',
        title: 'Own an embedded surface',
        body: 'Pass a concrete container when the sheet belongs inside a phone preview, editor canvas, or isolated application shell. The container must establish the size and clipping boundary that Sheet.Viewport should fill.',
        code: '<Sheet.Portal container={previewRef.current}>\n  <Sheet.Viewport>…</Sheet.Viewport>\n</Sheet.Portal>',
      },
      {
        id: 'stacking-contexts',
        title: 'Treat z-index as a system',
        body: 'A large z-index cannot escape an ancestor stacking context. Keep overlays in a documented application layer and inspect transformed, isolated, positioned, or opacity-adjusted ancestors when a sheet appears underneath unrelated UI.',
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    description:
      'Modal semantics, naming, focus, and restoration are built in.',
    group: 'learn',
    order: 9,
    sections: [
      {
        id: 'accessible-name',
        title: 'Name every sheet',
        body: 'Render Sheet.Title and optionally Sheet.Description inside Sheet.Content. Their generated ids are connected to the dialog automatically.',
      },
      {
        id: 'modal-and-non-modal',
        title: 'Modal and non-modal',
        body: 'Modal sheets contain focus, isolate background content, close with Escape when dismissible, and restore focus. Set modal to false for a persistent complementary interaction.',
      },
    ],
  },
  {
    slug: 'styling',
    title: 'Styling',
    description: 'Keep mechanics, theme, and application styles independent.',
    group: 'learn',
    order: 10,
    sections: [
      {
        id: 'entry-points',
        title: 'Three entry points',
        body: 'core.css contains positioning and interaction mechanics. theme.css contains optional visual tokens. styles.css imports both in deterministic layer order.',
      },
      {
        id: 'complete-replacement',
        title: 'Complete replacement',
        body: 'Import core.css only, then target the stable rsbs classes from your own stylesheet. Low-specificity library rules allow ordinary consumer selectors to win without important declarations.',
      },
    ],
  },
  {
    slug: 'examples',
    title: 'Examples',
    description: 'Working patterns for common sheet configurations.',
    group: 'reference',
    order: 1,
    sections: [
      {
        id: 'interactive-laboratory',
        title: 'Interactive laboratory',
        body: 'The examples route demonstrates controlled state, named snap points, modal behavior, nested scrolling, a custom portal target, theme replacement, dark mode, and reduced-motion-safe behavior.',
      },
    ],
  },
  {
    slug: 'api',
    title: 'API reference',
    description: 'The complete public surface for version 5.',
    group: 'reference',
    order: 2,
    sections: [
      {
        id: 'composition',
        title: 'Composition',
        body: 'Compose Sheet primitives around a shared root contract.',
      },
      {
        id: 'primitives',
        title: 'Primitives',
        body: 'Reference the Sheet namespace and each DOM primitive contract.',
      },
      {
        id: 'convenience-api',
        title: 'Convenience API',
        body: 'Use BottomSheet for the standard composition.',
      },
      {
        id: 'public-types',
        title: 'Public types',
        body: 'Reference callback details, change reasons, and snap-point values.',
      },
      {
        id: 'behavioral-guarantees',
        title: 'Behavioral guarantees',
        body: 'Understand state, focus, portal, dismissal, and motion behavior.',
      },
    ],
  },
  {
    slug: 'testing',
    title: 'Testing',
    description:
      'Assert user-visible sheet behavior without binding tests to animation internals.',
    group: 'reference',
    order: 3,
    sections: [
      {
        id: 'queries',
        title: 'Query the interface by role',
        body: 'Open the sheet through its trigger and query the resulting dialog by its accessible name. This verifies the same semantic boundary assistive technology receives and survives internal DOM changes.',
        code: "await user.click(screen.getByRole('button', { name: /open/i }))\nexpect(screen.getByRole('dialog', { name: /filters/i })).toBeVisible()",
      },
      {
        id: 'motion',
        title: 'Observe state instead of sleeping',
        body: 'Wait for the dialog to appear or be removed rather than adding fixed delays. For deterministic component tests, enable reduced motion; keep a smaller browser suite with real motion to protect opening, closing, drag, and focus-restoration behavior.',
      },
      {
        id: 'coverage',
        title: 'Cover the workflow boundaries',
        body: 'Test trigger, explicit close, Escape, backdrop, and drag only when your product enables them. Controlled integrations should also prove the callback updates application state and that focus returns after close.',
      },
    ],
  },
  {
    slug: 'performance',
    title: 'Performance',
    description:
      'Keep sheet content responsive across motion, layout changes, and long lists.',
    group: 'reference',
    order: 4,
    sections: [
      {
        id: 'render-boundary',
        title: 'Keep changing state close to its owner',
        body: 'The sheet can animate independently, but expensive descendants still rerender when their props change. Keep rapidly changing form or list state in focused child components and memoize only after measurement identifies meaningful work.',
      },
      {
        id: 'layout',
        title: 'Let content measurements settle',
        body: 'Content-sized destinations respond to layout changes. Reserve dimensions for images, avoid layout feedback loops, and prefer stable snap-point arrays when their meaning has not changed.',
        code: "const snapPoints = useMemo(() => [\n  { id: 'compact', value: '35%' },\n  { id: 'full', value: '90%' },\n], [])",
      },
      {
        id: 'large-content',
        title: 'Virtualize where the content needs it',
        body: 'A sheet does not make a large list inexpensive. Use the same virtualization and pagination strategy you would use on a page, and verify that the scroll owner remains the element expected by the gesture boundary.',
      },
    ],
  },
  {
    slug: 'migration',
    title: 'Migrate from version 4',
    description: 'Map legacy props and selectors to the redesigned contract.',
    group: 'project',
    order: 1,
    sections: [
      {
        id: 'migration-guide',
        title: 'Start with the migration guide',
        body: 'Version 5 intentionally changes component composition, callbacks, snap-point values, stylesheets, and supported React versions. Review the repository migration guide before upgrading.',
      },
    ],
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Resolve the most common integration mistakes.',
    group: 'project',
    order: 2,
    sections: [
      {
        id: 'missing-layout',
        title: 'The sheet has no layout',
        body: 'Import core.css or styles.css exactly once from your application entry point.',
      },
      {
        id: 'missing-name',
        title: 'The sheet has no accessible name',
        body: 'Place Sheet.Title inside Sheet.Content. Do not substitute a visual heading that is outside the sheet context.',
      },
      {
        id: 'controlled-state',
        title: 'Controlled state does not change',
        body: 'Update open in onOpenChange and activeSnapPoint in onSnapPointChange. Controlled props remain authoritative.',
      },
    ],
  },
  {
    slug: 'support',
    title: 'Support and maintenance',
    description:
      'Report reproducible problems, follow release channels, and contribute focused changes.',
    group: 'project',
    order: 3,
    sections: [
      {
        id: 'reporting',
        title: 'Make a problem reproducible',
        body: 'Include the package, React, browser, and operating-system versions; the expected and observed result; and a minimal reproduction. For interaction problems, identify whether the request came from a pointer, touch, keyboard, or assistive technology.',
      },
      {
        id: 'release-channels',
        title: 'Choose a release channel',
        body: 'Stable releases use npm latest. Prereleases use next and may change before the final major release. Pin an exact prerelease version when evaluating it in a shared application so an install cannot move unexpectedly.',
        code: 'npm install @nipe-solutions/react-spring-bottom-sheet@next',
      },
      {
        id: 'security',
        title: 'Report security issues privately',
        body: 'Do not publish an exploitable vulnerability in a public issue. Use the repository security reporting channel when available, or contact the maintainer directly using the address in the site imprint.',
      },
    ],
  },
] as const satisfies readonly DocPage[]
